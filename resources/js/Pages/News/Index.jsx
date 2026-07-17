import React, { useState, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Search, Plus, X, Image as ImageIcon, CheckCircle2,
    Clock, Tag, Trash2, Edit2, RotateCcw, Megaphone,
    Newspaper, Eye, Filter, ChevronDown, Calendar,
    Heart, MessageCircle, Send, Share2, Link2, Type, Globe, AlignRight,
    Info, AlertCircle
} from 'lucide-react';
import dayjs from 'dayjs';
import 'dayjs/locale/ar';
import relativeTime from 'dayjs/plugin/relativeTime';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';

dayjs.extend(relativeTime);
dayjs.locale('ar');

function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-2xl' }) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-md transition-opacity" onClick={onClose} />
            <div className={`relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full ${maxWidth} z-10 flex flex-col max-h-[90vh] overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                        {title}
                    </h3>
                    <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                        <X size={20} strokeWidth={2.5} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
}

const InputLabel = ({ value, children, required }) => (
    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
        {value || children} {required && <span className="text-rose-500">*</span>}
    </label>
);

const TextInput = ({ className = '', icon: Icon, ...props }) => (
    <div className="relative">
        <input
            {...props}
            className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${Icon ? 'pr-11 pl-4' : 'px-4'} py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 ${className}`}
        />
        {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon size={18} />
            </div>
        )}
    </div>
);

const TextArea = ({ className = '', ...props }) => (
    <textarea
        {...props}
        className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 resize-none ${className}`}
    />
);

const SelectInput = ({ options, className = '', icon: Icon, ...props }) => (
    <div className="relative">
        <select
            {...props}
            className={`w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl ${Icon ? 'pr-11 pl-10' : 'px-4 pl-10'} py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all cursor-pointer appearance-none ${className}`}
            style={{ backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'left 1rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em' }}
        >
            {options.map((opt, i) => (
                <option key={i} value={opt.value}>{opt.label}</option>
            ))}
        </select>
        {Icon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Icon size={18} />
            </div>
        )}
    </div>
);

const FileInput = ({ onChange, accept, error }) => (
    <div className="relative group">
        <input 
            type="file" 
            onChange={onChange} 
            accept={accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        />
        <div className={`w-full bg-slate-50 dark:bg-slate-900 border-2 border-dashed ${error ? 'border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-500/5' : 'border-slate-200 dark:border-slate-800 group-hover:border-primary-400 dark:group-hover:border-primary-500'} rounded-xl px-4 py-8 text-center transition-all flex flex-col items-center justify-center gap-3`}>
            <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-primary-500 group-hover:scale-110 transition-all">
                <ImageIcon size={24} />
            </div>
            <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">اضغط هنا لاختيار صورة الغلاف</p>
                <p className="text-xs font-bold text-slate-400 dark:text-slate-500">JPG, PNG, WEBP (الحد الأقصى 2MB)</p>
            </div>
        </div>
    </div>
);

const SkeletonCard = () => (
    <div className="bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-[2rem] overflow-hidden shadow-sm flex flex-col h-[420px] relative bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px]">
        <div className="h-48 sm:h-56 bg-slate-200/60 dark:bg-slate-800/60 animate-pulse relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        </div>
        <div className="p-6 flex flex-col flex-1 gap-4">
            <div className="flex justify-between">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-3 w-12 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="h-6 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mt-2" />
            <div className="h-6 w-1/2 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse mb-4" />
            <div className="space-y-3 mt-auto">
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-2 w-full bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-2 w-2/3 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
            <div className="flex gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
                <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
            </div>
        </div>
    </div>
);

export default function Index({ news, filters, stats, canManageNews = false }) {
    const { auth } = usePage().props;
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('add');
    const [deleteItem, setDeleteItem] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // Premium Quill Editor Modules
    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'align': [] }, { 'direction': 'rtl' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'color': [] }, { 'background': [] }],
            ['link', 'blockquote', 'code-block'],
            ['clean']
        ],
    };
    const [editItem, setEditItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [readProgress, setReadProgress] = useState(0);
    const [commentText, setCommentText] = useState('');
    const [existingAttachments, setExistingAttachments] = useState([]);
    const [imagePreviews, setImagePreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        if (viewItem) {
            const updatedItem = news.data.find(n => n.id === viewItem.id);
            if (updatedItem) setViewItem(updatedItem);
        }
    }, [news]);
    
    const [searchValue, setSearchValue] = useState(filters?.search || '');
    const [categoryFilter, setCategoryFilter] = useState(filters?.category || 'all');
    const [isLoading, setIsLoading] = useState(false);

    const hasActiveFilters = Boolean((searchValue && searchValue.trim() !== '') || (categoryFilter && categoryFilter !== 'all'));

    useEffect(() => {
        const removeStart = router.on('start', () => setIsLoading(true));
        const removeFinish = router.on('finish', () => setIsLoading(false));
        return () => {
            removeStart();
            removeFinish();
        };
    }, []);

    const { data, setData, post, processing, errors, reset } = useForm({
        title: '',
        content: '',
        category: 'عام',
        images: [],
        deleted_attachments: [],
        is_published: true,
        published_at: new Date(),
        _method: 'POST',
    });

    const applyFilters = (overrides = {}) => {
        router.get(route('news.index'), {
            search: overrides.search !== undefined ? overrides.search : searchValue,
            category: overrides.category !== undefined ? overrides.category : categoryFilter === 'all' ? '' : categoryFilter,
        }, { preserveState: true, replace: true });
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchValue !== (filters?.search || '')) applyFilters();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchValue]);

    const resetAllFilters = () => {
        setSearchValue('');
        setCategoryFilter('all');
        router.get(route('news.index'), {}, { preserveState: true, replace: true });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editItem) {
            data._method = 'PUT';
            post(route('news.update', editItem.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setEditItem(null);
                    setExistingAttachments([]);
                    setImagePreviews([]);
                    reset();
                }
            });
        } else {
            data._method = 'POST';
            post(route('news.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsAddModalOpen(false);
                    setExistingAttachments([]);
                    setImagePreviews([]);
                    reset();
                }
            });
        }
    };

    const openEditModal = (item) => {
            setEditItem(item);
            setExistingAttachments(item.attachments || []);
            setImagePreviews([]);
            setData({
                title: item.title,
                content: item.content,
                category: item.category,
                images: [],
                deleted_attachments: [],
                is_published: item.is_published,
                published_at: item.published_at ? new Date(item.published_at) : new Date(),
                _method: 'PUT'
            });
        };

    const handleFiles = (files) => {
        const newFiles = Array.from(files);
        const newPreviews = newFiles.map(file => URL.createObjectURL(file));
        setImagePreviews(prev => [...prev, ...newPreviews]);
        setData('images', [...data.images, ...newFiles]);
    };

    const handleRemovePreview = (index) => {
        const newImages = [...data.images];
        newImages.splice(index, 1);
        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setData('images', newImages);
        setImagePreviews(newPreviews);
    };

    const handleRemoveExisting = (attachmentId) => {
        setExistingAttachments(prev => prev.filter(att => att.id !== attachmentId));
        setData('deleted_attachments', [...data.deleted_attachments, attachmentId]);
    };

    const handleDelete = (item) => {
        setDeleteItem(item);
    };

    const confirmDelete = () => {
        if (!deleteItem) return;
        setIsDeleting(true);
        router.delete(route('news.destroy', deleteItem.id), { 
            preserveScroll: true,
            onSuccess: () => setDeleteItem(null),
            onFinish: () => setIsDeleting(false)
        });
    };

    const handleView = (item) => {
        setViewItem(item);
        setReadProgress(0);
        setCurrentImageIndex(0);
        router.post(route('news.view', item.id), {}, { preserveScroll: true, preserveState: true });
    };

    const handleScroll = (e) => {
        const element = e.target;
        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;
        
        if (scrollHeight === clientHeight) {
            setReadProgress(100);
        } else {
            const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
            setReadProgress(progress);
        }
    };

    const handleShare = (type) => {
        const url = window.location.href;
        const text = viewItem?.title || '';
        
        if (type === 'copy') {
            navigator.clipboard.writeText(url);
            alert('تم نسخ رابط الخبر بنجاح!');
        } else if (type === 'whatsapp') {
            window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        } else if (type === 'telegram') {
            window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
        }
    };

    const handleLike = (id) => {
        router.post(route('news.like', id), {}, { preserveScroll: true });
    };

    const submitComment = (e) => {
        e.preventDefault();
        if(!commentText.trim()) return;
        
        router.post(route('news.comment.store', viewItem.id), {
            content: commentText
        }, {
            preserveScroll: true,
            onSuccess: () => setCommentText('')
        });
    };

    const deleteComment = (commentId) => {
        if(confirm('هل تريد حذف هذا التعليق؟')) {
            router.delete(route('news.comment.destroy', commentId), { preserveScroll: true });
        }
    };

    const categories = [
        { value: 'عام', label: 'عام', color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400', icon: Newspaper },
        { value: 'عاجل', label: 'عاجل', color: 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400', icon: Megaphone, urgent: true },
        { value: 'فعاليات', label: 'فعاليات', color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400', icon: Calendar },
    ];

    const getCategoryDetails = (catName) => {
        return categories.find(c => c.value === catName) || categories[0];
    };

    const newsData = news.data || [];

    const featuredNews = !hasActiveFilters && newsData.length >= 3 ? newsData.slice(0, 3) : [];
    const regularNews = !hasActiveFilters && newsData.length >= 3 ? newsData.slice(3) : newsData;

    return (
        <AdminLayout
            title="الأخبار والإعلانات"
        >
            <div className="space-y-6 mb-8">
                {/* Header Title Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-400 to-primary-600" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400 shadow-[inset_0_0_20px_rgba(99,102,241,0.1)]">
                                <Megaphone size={24} strokeWidth={2.5} className="animate-pulse" />
                            </div>
                            الأخبار والإعلانات
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-sm max-w-xl leading-relaxed">
                            إدارة ونشر أحدث الأخبار والفعاليات في المدرسة، ابقِ الطلاب وأولياء الأمور على اطلاع دائم.
                        </p>
                    </div>
                    
                    {canManageNews && (
                        <button 
                            onClick={() => { reset(); setEditItem(null); setIsAddModalOpen(true); }}
                            className="relative z-10 flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-[0_8px_20px_-4px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_25px_-4px_rgba(79,70,229,0.4)] hover:-translate-y-0.5 active:translate-y-0 group"
                        >
                            <Plus size={20} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300" />
                            نشر خبر جديد
                        </button>
                    )}
                </div>

                {/* Stats Section */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -z-10 group-hover:bg-blue-500/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Newspaper size={28} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الأخبار</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total_news}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl -z-10 group-hover:bg-emerald-500/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <Eye size={28} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي القراءات</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.total_views}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 rounded-full blur-3xl -z-10 group-hover:bg-rose-500/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
                                    <Megaphone size={28} strokeWidth={2} className={stats.urgent_news > 0 ? "animate-pulse" : ""} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">أخبار عاجلة</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.urgent_news}</h3>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/60 rounded-3xl p-6 shadow-sm relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -z-10 group-hover:bg-amber-500/10 transition-colors" />
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                    <Clock size={28} strokeWidth={2} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">مجدولة للنشر</p>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white">{stats.scheduled_news}</h3>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Modern Filter Section */}
                <div className="bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-4 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -z-10 animate-pulse" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-xl group">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none text-slate-400 group-focus-within:text-primary-600 transition-colors">
                                <Search size={22} strokeWidth={2.5} />
                            </div>
                            <input 
                                type="text" 
                                placeholder="ابحث في الأخبار..."
                                className="w-full bg-slate-50 dark:bg-slate-950/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-primary-500 dark:focus:border-primary-500 focus:bg-white dark:focus:bg-slate-900 rounded-2xl pr-14 py-4 text-base focus:ring-4 focus:ring-primary-500/10 outline-none transition-all dark:text-white font-bold shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]"
                                value={searchValue} 
                                onChange={e => setSearchValue(e.target.value)}
                            />
                        </div>
                        
                        <div className="flex items-center gap-3">
                            {hasActiveFilters && (
                                <button 
                                    onClick={resetAllFilters}
                                    className="flex items-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-all border border-rose-100 dark:border-rose-500/10"
                                >
                                    <RotateCcw size={18} />
                                    <span className="hidden sm:inline">إعادة تعيين</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Interactive Category Pills */}
                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar">
                            {[{ value: 'all', label: 'الكل' }, ...categories].map(cat => {
                                const isSelected = (categoryFilter || 'all') === cat.value;
                                return (
                                    <button
                                        key={cat.value}
                                        onClick={() => { 
                                            setCategoryFilter(cat.value); 
                                            applyFilters({ category: cat.value }); 
                                        }}
                                        className={`flex items-center justify-center shrink-0 px-6 py-2.5 rounded-full text-sm font-black transition-all duration-300 snap-center border ${
                                            isSelected
                                                ? 'bg-primary-600 text-white border-primary-600 shadow-lg shadow-primary-600/30 dark:bg-primary-500 dark:border-primary-500 dark:shadow-primary-500/20 scale-105'
                                                : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        {cat.value === 'عاجل' && (
                                            <span className={`w-2 h-2 rounded-full mr-2 ${isSelected ? 'bg-white' : 'bg-rose-500'} animate-pulse`} />
                                        )}
                                        {cat.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* News Grid */}
                {isLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
                    </div>
                ) : newsData.length === 0 ? (
                    <div className="bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800/80 rounded-[2rem] p-12 text-center shadow-sm flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden backdrop-blur-xl">
                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] opacity-50" />
                        <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 rounded-[2rem] flex items-center justify-center mb-6 relative z-10 shadow-[0_0_40px_rgba(99,102,241,0.2)] animate-pulse">
                            <Newspaper className="w-10 h-10 text-primary-500 dark:text-primary-400" strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2 relative z-10 tracking-tight">لا توجد أخبار حالياً</h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mb-8 leading-relaxed font-medium relative z-10 text-sm">
                            لم يتم نشر أي أخبار أو إعلانات بعد. انقر على زر "نشر خبر جديد" للبدء في كتابة أول خبر وإبقائهم على اطلاع!
                        </p>
                        {!hasActiveFilters && canManageNews && (
                            <button onClick={() => { reset(); setEditItem(null); setIsAddModalOpen(true); }} className="relative z-10 flex items-center gap-2 px-8 py-3.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/20 hover:-translate-y-1 hover:shadow-primary-500/40">
                                <Plus size={18} strokeWidth={3} />
                                نشر خبر جديد
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 🌟 Hero Section (Bento Grid) */}
                        {featuredNews.length === 3 && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
                                {/* Main Featured News (2/3 width) */}
                                <div 
                                    className="lg:col-span-2 group relative bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-500 min-h-[400px] md:min-h-[500px] flex flex-col justify-end cursor-pointer"
                                    onClick={() => handleView(featuredNews[0])}
                                >
                                    <div className="absolute inset-0">
                                        {featuredNews[0].image_url ? (
                                            <img src={featuredNews[0].image_url} alt={featuredNews[0].title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70 group-hover:opacity-60" />
                                        ) : (
                                            <div className="w-full h-full bg-primary-900/50 flex items-center justify-center text-primary-400">
                                                <ImageIcon size={64} strokeWidth={1} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent opacity-90" />
                                    </div>
                                    <div className="relative p-8 md:p-12 z-10 w-full md:w-4/5">
                                        <div className="flex gap-2 mb-4">
                                            <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-primary-600/90 backdrop-blur-sm text-white shadow-lg border border-white/10">
                                                <Tag size={12} strokeWidth={3} />
                                                {featuredNews[0].category}
                                            </span>
                                            {getCategoryDetails(featuredNews[0].category).urgent && (
                                                <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-rose-500/90 backdrop-blur-sm text-white shadow-lg border border-white/10 animate-pulse">
                                                    عاجل
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-3xl md:text-5xl font-black text-white leading-[1.2] mb-4 drop-shadow-lg group-hover:text-primary-300 transition-colors">
                                            {featuredNews[0].title}
                                        </h2>
                                        <div 
                                            className="text-slate-300 font-medium line-clamp-2 text-sm md:text-base mb-6 leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: featuredNews[0]?.content || '' }}
                                        />
                                        <div className="flex items-center gap-6 text-slate-400">
                                            <span className="flex items-center gap-2 text-sm font-bold">
                                                <Clock size={16} className="text-primary-400" />
                                                {dayjs(featuredNews[0].published_at || featuredNews[0].created_at).fromNow()}
                                            </span>
                                            <span className="flex items-center gap-2 text-sm font-bold">
                                                <Eye size={16} className="text-primary-400" />
                                                {featuredNews[0].views_count || 0} قراءة
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Side News (1/3 width stacked) */}
                                <div className="flex flex-col gap-6 h-full">
                                    {[featuredNews[1], featuredNews[2]].map((item, idx) => (
                                        <div 
                                            key={item.id} 
                                            className="group relative bg-slate-900 rounded-[2rem] overflow-hidden shadow-lg hover:shadow-xl transition-all duration-500 flex-1 min-h-[220px] md:min-h-[238px] flex flex-col justify-end cursor-pointer"
                                            onClick={() => handleView(item)}
                                        >
                                            <div className="absolute inset-0">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-60 group-hover:opacity-50" />
                                                ) : (
                                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-600">
                                                        <ImageIcon size={32} />
                                                    </div>
                                                )}
                                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent opacity-90" />
                                            </div>
                                            <div className="relative p-6 z-10">
                                                <div className="flex gap-2 mb-3">
                                                    <span className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black bg-primary-600/90 backdrop-blur-sm text-white shadow-sm border border-white/10">
                                                        {item.category}
                                                    </span>
                                                </div>
                                                <h3 className="text-lg md:text-xl font-black text-white leading-snug mb-3 drop-shadow-md group-hover:text-primary-300 transition-colors line-clamp-2">
                                                    {item.title}
                                                </h3>
                                                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                    <Clock size={12} className="text-primary-400" />
                                                    {dayjs(item.published_at || item.created_at).fromNow()}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Regular Grid */}
                        {regularNews.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {regularNews.map(item => {
                                    const cat = getCategoryDetails(item.category);
                            return (
                                <div key={item.id} className="group bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/60 rounded-[2rem] overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1.5 transition-all duration-500 relative flex flex-col bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px]">
                                    {cat.urgent && (
                                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-400 via-rose-500 to-rose-600 animate-pulse z-10" />
                                    )}
                                    
                                    {/* Image Section */}
                                    <div className="relative h-48 sm:h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                                        {item.image_url ? (
                                            <img src={item.image_url} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                                <ImageIcon size={48} strokeWidth={1} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-80" />
                                        
                                        <div className="absolute top-4 right-4 flex gap-2">
                                            <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black backdrop-blur-md border border-white/20 shadow-sm ${cat.urgent ? 'bg-rose-500/90 text-white' : 'bg-white/90 text-slate-800 dark:bg-slate-900/90 dark:text-slate-200'}`}>
                                                <cat.icon size={12} strokeWidth={3} className={cat.urgent ? 'animate-bounce' : ''} />
                                                {cat.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Content Section */}
                                    <div className="p-6 flex flex-col flex-1">
                                        <div className="flex items-center justify-between gap-4 mb-3">
                                            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                                                <Clock size={14} />
                                                {dayjs(item.published_at || item.created_at).fromNow()}
                                            </span>
                                            {!item.is_published ? (
                                                <span className="text-[10px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-1 rounded-md">مسودة</span>
                                            ) : (
                                                item.published_at && new Date(item.published_at) > new Date() && (
                                                    <span className="text-[10px] font-black bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-md">مجدول</span>
                                                )
                                            )}
                                        </div>
                                        
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white mb-2 line-clamp-2 leading-tight group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        
                                        <div 
                                            className="text-sm font-medium text-slate-500 dark:text-slate-400 line-clamp-3 mb-6 leading-relaxed flex-1 prose-sm prose-slate dark:prose-invert"
                                            dangerouslySetInnerHTML={{ __html: item.content || '' }}
                                        />

                                        <div className="flex items-center gap-4 mb-4 text-slate-400 dark:text-slate-500">
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Eye size={14} />
                                                <span>{item.views_count || 0} قراءة</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Heart size={14} className={item.likes?.some(l => l.user_id === auth.user.id) ? 'fill-rose-500 text-rose-500' : ''} />
                                                <span>{item.likes_count || 0} إعجاب</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <MessageCircle size={14} />
                                                <span>{item.comments_count || 0} تعليق</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                            <button 
                                                onClick={() => handleView(item)}
                                                className="text-sm font-black text-primary-600 dark:text-primary-400 flex items-center gap-1 hover:gap-2 transition-all"
                                            >
                                                اقرأ المزيد
                                                <span className="text-[10px]">←</span>
                                            </button>

                                            {canManageNews && (
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openEditModal(item)} className="p-2 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">
                                                        <Edit2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                                        <Trash2 size={16} strokeWidth={2.5} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* View Modal */}
            {viewItem && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-8">
                    {/* Ambient Glow Backdrop */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
                        {viewItem.image_url && (
                            <img 
                                src={viewItem.image_url} 
                                alt=""
                                className="w-full h-full object-cover opacity-60 dark:opacity-40 blur-[100px] scale-125 saturate-200 transition-all duration-1000"
                            />
                        )}
                    </div>
                    <div className="absolute inset-0 bg-slate-200/50 dark:bg-slate-900/60 backdrop-blur-2xl transition-opacity" onClick={() => setViewItem(null)} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full h-[85vh] max-w-4xl z-10 flex flex-col overflow-hidden border border-white/20 dark:border-slate-700/50 transform transition-all scale-in-center">
                        
                        {/* Reading Progress Bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100/10 z-[70]">
                            <div 
                                className="h-full bg-gradient-to-r from-primary-500 via-primary-400 to-rose-500 transition-all duration-150 ease-out"
                                style={{ width: `${readProgress}%` }}
                            />
                        </div>

                        <div className="absolute inset-0 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px] opacity-20 pointer-events-none" />
                        <div className="absolute top-6 left-6 z-20 flex gap-3">
                            <button onClick={() => setViewItem(null)} className="w-12 h-12 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/10">
                                <X size={24} strokeWidth={2.5} />
                            </button>
                        </div>
                        
                        {/* Floating Share Buttons */}
                        <div className="hidden sm:flex absolute left-6 top-1/2 -translate-y-1/2 z-[70] flex-col gap-3">
                            <button onClick={() => handleShare('whatsapp')} className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#128C7E] flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 hover:-translate-y-1 group relative">
                                <MessageCircle size={20} className="fill-current" />
                                <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">واتساب</span>
                            </button>
                            <button onClick={() => handleShare('telegram')} className="w-12 h-12 rounded-full bg-[#0088cc] hover:bg-[#0077b5] flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 hover:-translate-y-1 group relative">
                                <Send size={20} className="fill-current -ml-1 mt-1" />
                                <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">تليجرام</span>
                            </button>
                            <button onClick={() => handleShare('copy')} className="w-12 h-12 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 hover:-translate-y-1 group relative">
                                <Link2 size={20} />
                                <span className="absolute right-full mr-4 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">نسخ الرابط</span>
                            </button>
                        </div>
                        
                        <div className="relative h-64 sm:h-80 shrink-0 bg-slate-100 dark:bg-slate-800">
                            {viewItem.attachments && viewItem.attachments.length > 0 ? (
                                <>
                                    <div className="relative w-full h-full">
                                        <img src={viewItem.attachments[currentImageIndex].file_url} alt={viewItem.title} className="w-full h-full object-cover transition-opacity duration-500" />
                                        
                                        {viewItem.attachments.length > 1 && (
                                            <>
                                                {/* Navigation Arrows */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => prev === 0 ? viewItem.attachments.length - 1 : prev - 1); }}
                                                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/10"
                                                >
                                                    <span className="sr-only">Previous</span>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                                </button>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(prev => (prev + 1) % viewItem.attachments.length); }}
                                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-md flex items-center justify-center text-white transition-all shadow-lg hover:scale-110 active:scale-95 border border-white/10"
                                                >
                                                    <span className="sr-only">Next</span>
                                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                                </button>

                                                {/* Dots Pagination */}
                                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                                                    {viewItem.attachments.map((_, idx) => (
                                                        <button 
                                                            key={idx}
                                                            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                                            className={`transition-all duration-300 rounded-full ${currentImageIndex === idx ? 'w-6 h-2 bg-white' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
                                                        />
                                                    ))}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </>
                            ) : viewItem.image_url ? (
                                <img src={viewItem.image_url} alt={viewItem.title} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <ImageIcon size={64} strokeWidth={1} />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent pointer-events-none z-10" />
                            
                            <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8">
                                <div className="flex gap-2 mb-4">
                                    <span className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-black bg-primary-600/90 backdrop-blur-sm text-white shadow-lg border border-white/10">
                                        <Tag size={12} strokeWidth={3} />
                                        {viewItem.category}
                                    </span>
                                </div>
                                <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight drop-shadow-md">
                                    {viewItem.title}
                                </h2>
                            </div>
                        </div>

                        <div 
                            className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white/90 dark:bg-slate-900/90 relative z-10 sm:pl-24"
                            onScroll={handleScroll}
                        >
                            <div className="flex items-center gap-6 mb-8 pb-6 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-500 dark:text-slate-400">
                                <span className="flex items-center gap-2">
                                    <Clock size={16} className="text-primary-500" />
                                    نُشر {dayjs(viewItem.created_at).format('DD MMMM YYYY - hh:mm A')}
                                </span>
                                <span className="flex items-center gap-2">
                                    <Eye size={16} className="text-primary-500" />
                                    {viewItem.views_count || 0} قراءة
                                </span>
                            </div>
                            
                            <div 
                                className="prose prose-slate dark:prose-invert max-w-none font-medium leading-loose text-slate-700 dark:text-slate-300 text-base sm:text-lg quill-content"
                                dangerouslySetInnerHTML={{ __html: viewItem?.content || '' }}
                            />

                            {/* Engagement Section */}
                            <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
                                        <MessageCircle className="text-primary-500" />
                                        التعليقات ({viewItem.comments_count || 0})
                                    </h3>
                                    <button 
                                        onClick={() => handleLike(viewItem.id)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                                            viewItem.likes?.some(l => l.user_id === auth.user.id)
                                                ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400'
                                                : 'bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400'
                                        }`}
                                    >
                                        <Heart 
                                            size={20} 
                                            className={viewItem.likes?.some(l => l.user_id === auth.user.id) ? 'fill-current' : ''} 
                                        />
                                        {viewItem.likes_count || 0} إعجاب
                                    </button>
                                </div>

                                {/* Comments List */}
                                <div className="space-y-6 mb-8">
                                    {viewItem.comments?.length > 0 ? (
                                        viewItem.comments.map(comment => (
                                            <div key={comment.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                                                <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shrink-0">
                                                    {comment.user?.name?.charAt(0) || 'U'}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                                                                {comment.user?.name}
                                                            </h4>
                                                            <span className="text-xs text-slate-400 dark:text-slate-500">
                                                                {dayjs(comment.created_at).fromNow()}
                                                            </span>
                                                        </div>
                                                        {(auth.user.id === comment.user_id || auth.user.roles?.[0]?.name === 'مدير النظام') && (
                                                            <button 
                                                                onClick={() => deleteComment(comment.id)}
                                                                className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-2">
                                                        {comment.content}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 text-slate-400 dark:text-slate-500 font-medium bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                            لا توجد تعليقات حتى الآن. كن أول من يعلق!
                                        </div>
                                    )}
                                </div>

                                {/* Add Comment Form */}
                                <form onSubmit={submitComment} className="flex gap-3">
                                    <input 
                                        type="text"
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value)}
                                        placeholder="اكتب تعليقاً..."
                                        className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white transition-all outline-none"
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!commentText.trim()}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <span>إرسال</span>
                                        <Send size={16} />
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal isOpen={isAddModalOpen || !!editItem} onClose={() => { setIsAddModalOpen(false); setEditItem(null); reset(); }} title={
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                        {editItem ? <Edit2 size={20} /> : <Plus size={20} />}
                    </div>
                    {editItem ? 'تعديل الخبر' : 'نشر خبر جديد'}
                </div>
            }>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1">
                            <InputLabel value="عنوان الخبر" required />
                            <TextInput
                                value={data.title}
                                onChange={e => setData('title', e.target.value)}
                                placeholder="اكتب عنواناً جذاباً للخبر..."
                                icon={Type}
                                required
                            />
                            {errors.title && <p className="text-xs text-rose-500 font-bold mt-1">{errors.title}</p>}
                        </div>

                        <div className="space-y-1">
                            <InputLabel value="تصنيف الخبر" required />
                            <SelectInput
                                value={data.category}
                                onChange={e => setData('category', e.target.value)}
                                options={categories}
                                icon={Tag}
                            />
                            {errors.category && <p className="text-xs text-rose-500 font-bold mt-1">{errors.category}</p>}
                        </div>

                        <div className="space-y-1">
                            <InputLabel value="حالة النشر" />
                            <SelectInput
                                value={data.is_published}
                                onChange={e => setData('is_published', e.target.value === 'true')}
                                icon={Globe}
                                options={[
                                    { value: 'true', label: 'نشر (يظهر للمستخدمين)' },
                                    { value: 'false', label: 'حفظ كمسودة (مخفي)' },
                                ]}
                            />
                        </div>

                        <div className="space-y-1">
                            <InputLabel value="تاريخ النشر" />
                            <div className="relative">
                                <Flatpickr
                                    data-enable-time
                                    value={data.published_at}
                                    onChange={([date]) => setData('published_at', date)}
                                    options={{ 
                                        dateFormat: 'Y-m-d H:i',
                                        time_24hr: false 
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 dark:text-white font-bold transition-all"
                                    placeholder="اختر تاريخ النشر"
                                />
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Calendar size={18} />
                                </div>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-1">اذا تم اختيار تاريخ مستقبلي، سيتم جدولة الخبر تلقائياً.</p>
                            {errors.published_at && <p className="text-xs text-rose-500 font-bold mt-1">{errors.published_at}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <div className="flex items-center justify-between">
                                <InputLabel value="تفاصيل الخبر" required />
                                <span className="text-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 py-0.5 rounded-full font-bold">المحرر الذكي</span>
                            </div>
                            
                            {/* Premium Quill Editor Wrapper */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700/60 focus-within:ring-4 focus-within:ring-primary-500/10 focus-within:border-primary-500 transition-all shadow-sm">
                                <style>{`
                                    .premium-quill .ql-toolbar.ql-snow {
                                        border: none;
                                        border-bottom: 1px solid #e2e8f0;
                                        background: #f8fafc;
                                        padding: 12px 16px;
                                        border-radius: 1rem 1rem 0 0;
                                        font-family: inherit;
                                    }
                                    .dark .premium-quill .ql-toolbar.ql-snow {
                                        border-bottom: 1px solid #334155;
                                        background: #0f172a;
                                    }
                                    .premium-quill .ql-container.ql-snow {
                                        border: none;
                                        font-family: inherit;
                                        font-size: 1rem;
                                    }
                                    .premium-quill .ql-editor {
                                        min-height: 250px;
                                        padding: 20px;
                                        font-family: 'Tajawal', 'Cairo', sans-serif;
                                        line-height: 1.8;
                                    }
                                    .premium-quill .ql-editor.ql-blank::before {
                                        font-style: normal;
                                        color: #94a3b8;
                                        right: 20px;
                                        left: auto;
                                    }
                                    .dark .premium-quill .ql-stroke {
                                        stroke: #cbd5e1;
                                    }
                                    .dark .premium-quill .ql-fill {
                                        fill: #cbd5e1;
                                    }
                                    .dark .premium-quill .ql-picker {
                                        color: #cbd5e1;
                                    }
                                    .dark .premium-quill .ql-picker-options {
                                        background-color: #1e293b;
                                        border-color: #334155;
                                    }
                                    .dark .premium-quill .ql-picker-item:hover {
                                        color: #38bdf8;
                                    }
                                    .premium-quill .ql-active {
                                        color: #0ea5e9 !important;
                                    }
                                    .premium-quill .ql-active .ql-stroke {
                                        stroke: #0ea5e9 !important;
                                    }
                                    .premium-quill .ql-active .ql-fill {
                                        fill: #0ea5e9 !important;
                                    }
                                `}</style>
                                <ReactQuill
                                    theme="snow"
                                    value={data.content}
                                    onChange={content => setData('content', content)}
                                    placeholder="ابدأ بكتابة تفاصيل الخبر الممتعة هنا... يمكنك تنسيق النص بحرية"
                                    modules={quillModules}
                                    className="premium-quill bg-white dark:bg-slate-900 dark:text-white"
                                />
                            </div>
                            {errors.content && <p className="text-xs text-rose-500 font-bold mt-1">{errors.content}</p>}
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <InputLabel value="الصور والمرفقات (اختياري)" />
                            
                            {/* Drag & Drop Zone */}
                            <div 
                                className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                                    isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-primary-400 dark:hover:border-primary-500 bg-slate-50 dark:bg-slate-800/50'
                                }`}
                                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    setIsDragging(false);
                                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                        handleFiles(e.dataTransfer.files);
                                    }
                                }}
                            >
                                <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={(e) => {
                                        if (e.target.files && e.target.files.length > 0) {
                                            handleFiles(e.target.files);
                                        }
                                    }}
                                />
                                <ImageIcon size={40} className="mx-auto text-slate-400 mb-3" />
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                                    اسحب وأفلت الصور هنا، أو انقر للاختيار
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    PNG, JPG, GIF حتى 5MB لكل صورة
                                </p>
                            </div>
                            {errors.images && <p className="text-xs text-rose-500 font-bold mt-1">{errors.images}</p>}

                            {/* Image Previews Grid */}
                            {(existingAttachments.length > 0 || imagePreviews.length > 0) && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
                                    {existingAttachments.map((att) => (
                                        <div key={att.id} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 aspect-square">
                                            <img src={att.file_url} alt="Attachment" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveExisting(att.id)}
                                                    className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 hover:scale-110 transition-all shadow-md"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    {imagePreviews.map((preview, idx) => (
                                        <div key={`new-${idx}`} className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700 aspect-square">
                                            <img src={preview} alt="New Upload" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemovePreview(idx)}
                                                    className="w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 hover:scale-110 transition-all shadow-md"
                                                >
                                                    <X size={16} strokeWidth={3} />
                                                </button>
                                            </div>
                                            <div className="absolute top-2 right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                                جديد
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => { setIsAddModalOpen(false); setEditItem(null); reset(); }}
                            className="px-6 py-3.5 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            إلغاء
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-primary-600 text-white hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/30 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {processing ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <CheckCircle2 size={20} strokeWidth={2.5} />
                            )}
                            {editItem ? 'حفظ التعديلات' : 'نشر الخبر'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Floating Action Button (FAB) */}
            {canManageNews && !isAddModalOpen && !editItem && (
                <button
                    onClick={() => { reset(); setEditItem(null); setIsAddModalOpen(true); }}
                    className="fixed bottom-8 left-8 z-[55] w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(var(--color-primary-600),0.5)] hover:bg-primary-700 hover:shadow-[0_15px_50px_rgba(var(--color-primary-600),0.7)] hover:-translate-y-2 hover:scale-110 transition-all duration-300 group"
                    title="نشر خبر جديد"
                >
                    <div className="absolute inset-0 rounded-full bg-white opacity-0 group-hover:animate-ping duration-1000" />
                    <Plus size={28} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-500 relative z-10" />
                </button>
            )}
            {/* Delete Modal */}
            <Modal isOpen={!!deleteItem} onClose={() => !isDeleting && setDeleteItem(null)} title={
                <div className="flex items-center gap-2 text-rose-600">
                    <Trash2 size={24} />
                    <span>تأكيد الحذف</span>
                </div>
            } maxWidth="max-w-md">
                <div className="text-center">
                    <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle size={40} strokeWidth={1.5} />
                    </div>
                    <h4 className="text-xl font-bold text-slate-800 dark:text-white mb-2">هل أنت متأكد من حذف هذا الخبر؟</h4>
                    <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                        سيتم حذف الخبر <span className="font-bold text-slate-700 dark:text-slate-300">"{deleteItem?.title}"</span> وجميع التعليقات والإعجابات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setDeleteItem(null)}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all disabled:opacity-50"
                        >
                            إلغاء
                        </button>
                        <button 
                            onClick={confirmDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isDeleting ? 'جاري الحذف...' : 'نعم، احذف الخبر'}
                        </button>
                    </div>
                </div>
            </Modal>

        </AdminLayout>
    );
}
