import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, PenTool, CheckCircle, AlertTriangle, CalendarDays, Search, X, User, CheckSquare, FileBadge, Check, XCircle, Tag, Calendar, AlignLeft } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

export default function Pledges({ auth, pledges, students, violations }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingPledge, setEditingPledge] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState(''); // 'all', 'fully_signed', 'partially_signed', 'unsigned'
    
    // Digital Signature State
    const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
    const [signatureType, setSignatureType] = useState('student');
    const [signingPledge, setSigningPledge] = useState(null);
    let sigPad = React.useRef({});

    const { data, setData, post, put, delete: destroy, errors, reset } = useForm({
        student_id: '',
        student_violation_id: '',
        pledge_text: '',
        date: '',
        is_signed_by_student: false,
        is_signed_by_parent: false,
        attachment: null,
    });

    const openModal = (pledge = null) => {
        setEditingPledge(pledge);
        if (pledge) {
            setData({
                student_id: pledge.student_id,
                student_violation_id: pledge.student_violation_id || '',
                pledge_text: pledge.pledge_text || '',
                date: pledge.date ? pledge.date.split('T')[0] : '',
                is_signed_by_student: pledge.is_signed_by_student || false,
                is_signed_by_parent: pledge.is_signed_by_parent || false,
                attachment: null,
            });
        } else {
            reset();
            setData('date', new Date().toISOString().split('T')[0]);
            setData('attachment', null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingPledge) {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            Object.keys(data).forEach(key => {
                if (data[key] !== null && typeof data[key] !== 'boolean') formData.append(key, data[key]);
                if (typeof data[key] === 'boolean') formData.append(key, data[key] ? 1 : 0);
            });
            
            router.post(route('academic.student-pledges.update', editingPledge.id), formData, {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.student-pledges.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (pledge) => {
        setEditingPledge(pledge);
        setIsDeleteModalOpen(true);
    };

    const deletePledge = () => {
        destroy(route('academic.student-pledges.destroy', editingPledge.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const toggleSignature = (pledge, type) => {
        const payload = {
            ...pledge,
            is_signed_by_student: type === 'student' ? !pledge.is_signed_by_student : pledge.is_signed_by_student,
            is_signed_by_parent: type === 'parent' ? !pledge.is_signed_by_parent : pledge.is_signed_by_parent,
        };

        router.put(route('academic.student-pledges.update', pledge.id), payload, {
            preserveScroll: true
        });
    };

    const openSignatureModal = (pledge, type) => {
        setSigningPledge(pledge);
        setSignatureType(type);
        setIsSignatureModalOpen(true);
        // We delay clearing to ensure modal renders first
        setTimeout(() => {
            if (sigPad.current) {
                sigPad.current.clear();
            }
        }, 100);
    };

    const closeSignatureModal = () => {
        setIsSignatureModalOpen(false);
        setSigningPledge(null);
    };

    const saveSignature = () => {
        if (sigPad.current.isEmpty()) {
            alert('الرجاء رسم التوقيع أولاً');
            return;
        }
        
        const dataURL = sigPad.current.getTrimmedCanvas().toDataURL('image/png');
        
        router.post(route('academic.student-pledges.sign', signingPledge.id), {
            signature_type: signatureType,
            signature_data: dataURL
        }, {
            onSuccess: () => closeSignatureModal()
        });
    };

    // Client-side filtering
    const filteredPledges = useMemo(() => {
        return pledges.filter(p => {
            const matchesSearch = !searchQuery || 
                p.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                p.pledge_text?.toLowerCase().includes(searchQuery.toLowerCase());
            
            let matchesStatus = true;
            if (statusFilter === 'fully_signed') {
                matchesStatus = p.is_signed_by_student && p.is_signed_by_parent;
            } else if (statusFilter === 'partially_signed') {
                matchesStatus = (p.is_signed_by_student && !p.is_signed_by_parent) || (!p.is_signed_by_student && p.is_signed_by_parent);
            } else if (statusFilter === 'unsigned') {
                matchesStatus = !p.is_signed_by_student && !p.is_signed_by_parent;
            }

            return matchesSearch && matchesStatus;
        });
    }, [pledges, searchQuery, statusFilter]);

    // Calculate Stats
    const stats = {
        total: pledges.length,
        fully_signed: pledges.filter(p => p.is_signed_by_student && p.is_signed_by_parent).length,
        partially_signed: pledges.filter(p => (p.is_signed_by_student && !p.is_signed_by_parent) || (!p.is_signed_by_student && p.is_signed_by_parent)).length,
        unsigned: pledges.filter(p => !p.is_signed_by_student && !p.is_signed_by_parent).length,
    };

    return (
        <AdminLayout user={auth.user} activeMenu="تعهدات الطلاب">
            <Head title="تعهدات الطلاب" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Visual geometric lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <PenTool size={28} className="text-primary-600" />
                                تعهدات الطلاب
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة التعهدات السلوكية ومتابعة توقيع الطلاب وأولياء أمورهم</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إنشاء تعهد جديد</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-6 mb-2">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <PenTool className="text-primary-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي التعهدات</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CheckCircle className="text-emerald-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">مكتمل التوقيع</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.fully_signed}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-amber-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <AlertTriangle className="text-amber-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">توقيع جزئي</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.partially_signed}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-rose-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <XCircle className="text-rose-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">غير موقع نهائياً</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.unsigned}</h4>
                        </div>
                    </div>
                </div>

                {/* Smart Toolbar */}
                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    {/* Status Tabs */}
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        {[
                            { value: '', label: 'الكل' }, 
                            { value: 'fully_signed', label: 'مكتمل التوقيع' }, 
                            { value: 'partially_signed', label: 'توقيع جزئي' },
                            { value: 'unsigned', label: 'غير موقع' }
                        ].map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setStatusFilter(opt.value)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${statusFilter === opt.value ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-sm">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الطالب أو نص التعهد..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الطالب</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">تاريخ التعهد</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-1/3">نص التعهد والمخالفة المرتبطة</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">حالة التوقيع</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredPledges.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <PenTool size={40} className="mb-3 text-slate-300" />
                                                <p className="font-bold">لا توجد تعهدات مسجلة</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPledges.map((p) => (
                                        <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{p.student?.user?.name || '-'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">الرقم: {p.student?.student_number || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                    <CalendarDays size={16} className="text-primary-500" />
                                                    {p.date}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                                                    {p.student_violation_id && (
                                                        <p className="mb-1 truncate font-semibold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 inline-block px-2 py-0.5 rounded-lg border border-rose-100 dark:border-rose-500/20">
                                                            <span className="font-black">مخالفة مرتبطة:</span> {p.violation?.violation_type?.name}
                                                        </p>
                                                    )}
                                                    <p className="line-clamp-2 font-semibold text-slate-500 leading-relaxed" title={p.pledge_text}>{p.pledge_text}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex flex-col gap-3">
                                                    {p.is_signed_by_student ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-8 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                                                                {p.student_signature_path ? (
                                                                    <img src={`/storage/${p.student_signature_path}`} alt="توقيع الطالب" className="h-full object-contain" />
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400">موقع يدوياً</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600"><Check size={12} className="inline mr-1"/> الطالب</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openSignatureModal(p, 'student')}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                        >
                                                            <PenTool size={12} />
                                                            توقيع الطالب
                                                        </button>
                                                    )}
                                                    
                                                    {p.is_signed_by_parent ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-16 h-8 bg-white border border-slate-200 rounded overflow-hidden flex items-center justify-center">
                                                                {p.parent_signature_path ? (
                                                                    <img src={`/storage/${p.parent_signature_path}`} alt="توقيع ولي الأمر" className="h-full object-contain" />
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400">موقع يدوياً</span>
                                                                )}
                                                            </div>
                                                            <span className="text-xs font-bold text-emerald-600"><Check size={12} className="inline mr-1"/> ولي الأمر</span>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            onClick={() => openSignatureModal(p, 'parent')}
                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black uppercase tracking-wider transition-all hover:scale-[1.02] cursor-pointer bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700"
                                                        >
                                                            <PenTool size={12} />
                                                            توقيع ولي الأمر
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {p.attachment_path && (
                                                        <a href={`/storage/${p.attachment_path}`} target="_blank" rel="noopener noreferrer" title="عرض المرفق" className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all shadow-sm">
                                                            <FileBadge size={14} />
                                                        </a>
                                                    )}
                                                    <button onClick={() => openModal(p)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(p)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        {/* Header */}
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <PenTool size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingPledge ? 'تعديل التعهد' : 'إنشاء تعهد جديد'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">قم بتعبئة بيانات التعهد وتحديد حالة التوقيع</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <div className="p-8">
                            <form onSubmit={submit} className="space-y-6">
                                {!editingPledge && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الطالب <span className="text-rose-500">*</span></label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white appearance-none"
                                                    value={data.student_id}
                                                    onChange={e => setData('student_id', e.target.value)}
                                                    required
                                                >
                                                    <option value="">-- اختر الطالب --</option>
                                                    {students.map(s => (
                                                        <option key={s.id} value={s.id}>{s.user?.name}</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-5 text-slate-400">
                                                    <User size={16} />
                                                </div>
                                            </div>
                                            {errors.student_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_id}</p>}
                                        </div>

                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">ارتباط بمخالفة (اختياري)</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white appearance-none"
                                                    value={data.student_violation_id}
                                                    onChange={e => setData('student_violation_id', e.target.value)}
                                                >
                                                    <option value="">-- بدون مخالفة مرتبطة --</option>
                                                    {violations.filter(v => !data.student_id || v.student_id == data.student_id).map(v => (
                                                        <option key={v.id} value={v.id}>{v.violation_type?.name} ({v.violation_date})</option>
                                                    ))}
                                                </select>
                                                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-5 text-slate-400">
                                                    <Tag size={16} />
                                                </div>
                                            </div>
                                            {errors.student_violation_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_violation_id}</p>}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ التعهد <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <input
                                            type="date"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-5 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.date}
                                            onChange={e => setData('date', e.target.value)}
                                            required
                                        />
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400">
                                            <Calendar size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نص التعهد <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.pledge_text}
                                            onChange={e => setData('pledge_text', e.target.value)}
                                            rows="4"
                                            required
                                            placeholder="أقر أنا الطالب / ولي الأمر بأنني..."
                                        />
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <AlignLeft size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                                    <h4 className="font-bold text-slate-800 dark:text-white mb-4">موقف التوقيع (بعد طباعة وتوقيع الورقة)</h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${data.is_signed_by_student ? 'bg-primary-50 border-primary-200 dark:bg-primary-500/10 dark:border-primary-500/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'}`}
                                             onClick={() => setData('is_signed_by_student', !data.is_signed_by_student)}>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border ${data.is_signed_by_student ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'}`}>
                                                {data.is_signed_by_student && <Check size={14} />}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">تم التوقيع من قبل الطالب</span>
                                        </div>

                                        <div className={`flex items-center gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${data.is_signed_by_parent ? 'bg-primary-50 border-primary-200 dark:bg-primary-500/10 dark:border-primary-500/30' : 'bg-slate-50 border-slate-200 dark:bg-slate-900/50 dark:border-slate-700'}`}
                                             onClick={() => setData('is_signed_by_parent', !data.is_signed_by_parent)}>
                                            <div className={`w-6 h-6 rounded flex items-center justify-center border ${data.is_signed_by_parent ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-slate-300 dark:bg-slate-800 dark:border-slate-600'}`}>
                                                {data.is_signed_by_parent && <Check size={14} />}
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">تم التوقيع من قبل ولي الأمر</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نسخة إلكترونية من التعهد (مرفق)</label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-5 pr-14 py-2.5 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 transition-all dark:text-white dark:file:bg-primary-900/20 dark:file:text-primary-400"
                                            onChange={e => setData('attachment', e.target.files[0])}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
                                            <FileBadge size={18} />
                                        </div>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-2 font-semibold">يمكنك رفع صورة أو ملف PDF للتعهد بعد توقيعه ورقياً كإثبات.</p>
                                    {errors.attachment && <p className="text-xs text-rose-500 mt-1.5">{errors.attachment}</p>}
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-6 py-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                        إلغاء
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95">
                                        <CheckSquare size={18} />
                                        <span>حفظ التعهد</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Trash2 size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-rose-500 opacity-20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-8">
                            هل أنت متأكد من حذف هذا التعهد من السجل؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={deletePledge} className="flex-1 py-4 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/20">
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Signature Modal */}
            {isSignatureModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-slate-900/80 dark:bg-black/80 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                {signatureType === 'student' ? 'توقيع الطالب' : 'توقيع ولي الأمر'}
                            </h3>
                            <button onClick={closeSignatureModal} className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-colors shadow-sm">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-semibold text-center">
                                يرجى رسم التوقيع داخل المربع أدناه
                            </p>
                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                                <SignatureCanvas 
                                    penColor="black"
                                    canvasProps={{className: 'sigCanvas w-full h-64'}}
                                    ref={sigPad}
                                />
                            </div>
                            <div className="flex justify-between items-center mt-6">
                                <button 
                                    type="button" 
                                    onClick={() => sigPad.current.clear()}
                                    className="px-5 py-2.5 rounded-2xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
                                >
                                    مسح التوقيع
                                </button>
                                <button 
                                    type="button" 
                                    onClick={saveSignature}
                                    className="px-8 py-2.5 rounded-2xl font-black text-white bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 shadow-md shadow-primary-500/20 transition-all hover:-translate-y-0.5"
                                >
                                    اعتماد وحفظ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
