import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin, UserCheck, Shield, LayoutGrid, List, Printer, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';

export default function ParentsIndex({ parents }) {
    const { appLogo, flash } = usePage().props;
    const logoUrl = appLogo || '/images/logo.png';
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

    useEffect(() => {
        if (flash.generated_credentials) {
            const isReset = flash.success && flash.success.includes('إعادة تعيين');
            Swal.fire({
                title: isReset ? 'تم إعادة تعيين كلمة المرور!' : 'تم إنشاء الحساب بنجاح!',
                html: `
                    <div dir="rtl" class="text-right space-y-3 mb-4">
                        <p class="text-slate-600">${isReset ? 'تم توليد بيانات دخول جديدة لولي الأمر بنجاح:' : 'تم توليد بيانات الدخول لولي الأمر بنجاح:'}</p>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <p class="font-bold text-slate-800">الاسم: <span class="font-normal text-primary-600">${flash.generated_credentials.name}</span></p>
                            <p class="font-bold text-slate-800 mt-2">اسم المستخدم: <span class="font-mono bg-white px-2 py-1 rounded border text-primary-600">${flash.generated_credentials.username}</span></p>
                            <p class="font-bold text-slate-800 mt-2">كلمة المرور: <span class="font-mono bg-white px-2 py-1 rounded border text-primary-600">${flash.generated_credentials.password}</span></p>
                        </div>
                    </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '<i class="fas fa-print"></i> طباعة البطاقة',
                cancelButtonText: 'إغلاق',
                confirmButtonColor: '#0ea5e9'
            }).then((result) => {
                if (result.isConfirmed) {
                    printCredentials(
                        flash.generated_credentials.name,
                        flash.generated_credentials.username,
                        flash.generated_credentials.password,
                        logoUrl
                    );
                }
            });
        }
    }, [flash.generated_credentials]);

    const printCredentials = (name, username, password = null, logoUrl = '') => {
        const printWindow = window.open('', '_blank');
        const pwdDisplay = password ? password : '<span style="color:#94a3b8; letter-spacing:4px; font-size:18px;">••••••••</span>';
        const pwdNote = password 
            ? 'الرجاء الاحتفاظ بهذه الورقة في مكان آمن وعدم مشاركتها مع أي شخص.'
            : 'كلمة المرور مخفية لدواعي أمنية. في حال فقدانها يرجى طلب إعادة تعيين من الإدارة.';
        
        // Fallback logo if none provided
        const logoHtml = logoUrl 
            ? '<img src="' + logoUrl + '" class="logo" />'
            : '<svg class="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>';

        const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });

        const html = `
            <html dir="rtl">
            <head>
                <title>بيانات الدخول - ${name}</title>
                <style>
                    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
                    
                    :root {
                        --primary: #0f1419; /* Brand Black */
                        --secondary: #6b9b37; /* Brand Green */
                        --accent: #cc2b2b; /* Brand Red */
                        --gray-light: #f8fafc;
                        --gray-border: #e2e8f0;
                        --gray-text: #64748b;
                    }
                    
                    body { 
                        font-family: 'Tajawal', system-ui, sans-serif; 
                        background: #f1f5f9; 
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        min-height: 100vh;
                        margin: 0;
                        padding: 40px;
                    }
                    
                    .print-card {
                        background: #ffffff;
                        width: 100%;
                        max-width: 100%;
                        border-radius: 20px;
                        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
                        overflow: hidden;
                        position: relative;
                        border: 1px solid var(--gray-border);
                    }

                    .print-header {
                        background: var(--secondary);
                        color: white;
                        padding: 40px 30px;
                        text-align: center;
                        position: relative;
                        overflow: hidden;
                    }
                    
                    .print-header::after {
                        content: '';
                        position: absolute;
                        bottom: -20px;
                        left: 0;
                        right: 0;
                        height: 40px;
                        background: #ffffff;
                        transform: skewY(-3deg);
                    }

                    .logo-container {
                        display: inline-flex;
                        justify-content: center;
                        align-items: center;
                        background: white;
                        width: 80px;
                        height: 80px;
                        border-radius: 50%;
                        margin-bottom: 15px;
                        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                        position: relative;
                        z-index: 2;
                    }

                    .logo {
                        width: 50px;
                        height: 50px;
                        object-fit: contain;
                    }
                    
                    .logo-svg {
                        width: 40px;
                        height: 40px;
                        color: var(--secondary);
                    }

                    .document-title {
                        margin: 0;
                        font-size: 28px;
                        font-weight: 900;
                        letter-spacing: -0.5px;
                        position: relative;
                        z-index: 2;
                    }

                    .document-subtitle {
                        margin: 5px 0 0;
                        font-size: 15px;
                        color: #cbd5e1;
                        font-weight: 500;
                        position: relative;
                        z-index: 2;
                    }

                    .print-body {
                        padding: 30px 40px 40px;
                        position: relative;
                    }

                    .watermark {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%) rotate(-30deg);
                        font-size: 140px;
                        font-weight: 900;
                        color: rgba(0, 0, 0, 0.02);
                        white-space: nowrap;
                        z-index: 0;
                        pointer-events: none;
                    }

                    .employee-section {
                        text-align: center;
                        margin-bottom: 35px;
                        position: relative;
                        z-index: 1;
                    }

                    .greeting {
                        color: var(--gray-text);
                        font-size: 16px;
                        margin-bottom: 5px;
                    }

                    .employee-name {
                        font-size: 26px;
                        font-weight: 800;
                        color: var(--primary);
                        margin: 0;
                        display: inline-block;
                        border-bottom: 4px solid var(--secondary);
                        padding-bottom: 5px;
                    }

                    .credentials-grid {
                        display: grid;
                        grid-template-columns: 1fr 1fr;
                        gap: 15px;
                        position: relative;
                        z-index: 1;
                    }

                    .cred-box {
                        background: var(--gray-light);
                        border: 1px solid var(--gray-border);
                        border-radius: 12px;
                        padding: 20px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        gap: 15px;
                        position: relative;
                        overflow: hidden;
                    }

                    .cred-box::before {
                        content: '';
                        position: absolute;
                        right: 0;
                        top: 0;
                        bottom: 0;
                        width: 6px;
                        background: var(--secondary);
                    }

                    .cred-box.password-box::before {
                        background: var(--accent);
                    }

                    .cred-label {
                        color: var(--gray-text);
                        font-size: 16px;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 10px;
                    }

                    .cred-icon {
                        width: 22px;
                        height: 22px;
                        opacity: 0.8;
                    }

                    .cred-value {
                        font-family: 'SF Mono', 'Courier New', monospace;
                        font-size: 20px;
                        font-weight: 900;
                        color: var(--primary);
                        direction: ltr;
                        letter-spacing: 1px;
                        background: white;
                        padding: 10px;
                        border-radius: 8px;
                        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                        border: 1px dashed #cbd5e1;
                        width: 100%;
                        text-align: center;
                        box-sizing: border-box;
                    }

                    .print-footer {
                        margin-top: 35px;
                        padding-top: 20px;
                        border-top: 2px dashed var(--gray-border);
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        gap: 10px;
                        font-size: 13px;
                        position: relative;
                        z-index: 1;
                    }

                    .security-note {
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        color: #ef4444;
                        font-weight: 700;
                        background: #fef2f2;
                        padding: 8px 16px;
                        border-radius: 8px;
                        border: 1px solid #fca5a5;
                    }
                    
                    .date-stamp {
                        color: var(--gray-text);
                        font-weight: 500;
                    }

                    @media print { 
                        body { 
                            background: #fff; 
                            padding: 0;
                            align-items: flex-start;
                        } 
                        .print-card { 
                            box-shadow: none; 
                            border: none;
                            margin: 0;
                            border-radius: 0;
                        }
                        * {
                            -webkit-print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="print-card">
                    <div class="print-header">
                        <div class="logo-container">
                            ${logoHtml}
                        </div>
                        <h1 class="document-title">بطاقة الصلاحيات</h1>
                        <p class="document-subtitle">وثيقة تسليم بيانات الدخول النظام</p>
                    </div>
                    
                    <div class="print-body">
                        <div class="watermark">سري وخاص</div>
                        
                        <div class="employee-section">
                            <div class="greeting">السيد/ة،</div>
                            <h2 class="employee-name">${name}</h2>
                        </div>

                        <div class="credentials-grid">
                            <div class="cred-box">
                                <div class="cred-label">
                                    <svg class="cred-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    اسم المستخدم:
                                </div>
                                <div class="cred-value">${username}</div>
                            </div>
                            
                            <div class="cred-box password-box">
                                <div class="cred-label">
                                    <svg class="cred-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    كلمة المرور:
                                </div>
                                <div class="cred-value">${pwdDisplay}</div>
                            </div>
                        </div>

                        <div class="print-footer">
                            <div class="security-note">
                                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <span>${pwdNote}</span>
                            </div>
                            <div class="date-stamp">
                                تاريخ الإصدار: ${dateStr}
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 800); }
                </script>
            </body>
            </html>
        `;
        printWindow.document.write(html);
        printWindow.document.close();
    };

    const handleResetPassword = (id) => {
        Swal.fire({
            title: 'إعادة تعيين كلمة المرور',
            text: "هل أنت متأكد من إعادة تعيين كلمة مرور هذا المستخدم؟ سيتم توليد كلمة مرور جديدة تلقائياً.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0ea5e9',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، أعد التعيين',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('academic.parents.reset-password', id), {}, {
                    preserveScroll: true,
                });
            }
        });
    };

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

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/30">
                                <Users size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">أولياء الأمور</h1>
                                <p className="text-primary-700/80 dark:text-primary-300/80 text-sm mt-1 font-semibold">إدارة حسابات وبيانات أولياء أمور الطلاب</p>
                            </div>
                        </div>

                        <div className="flex w-full md:w-auto items-center gap-3">
                            {/* View Toggle */}
                            <div className="hidden md:flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <LayoutGrid size={18} />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    <List size={18} />
                                </button>
                            </div>

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

                {/* Parents List - Table or Grid */}
                {parents.data.length > 0 ? (
                    viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {parents.data.map((parent) => (
                                <div key={parent.id} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl border border-primary-200/50 dark:border-primary-500/20 shrink-0 shadow-inner">
                                                {parent.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 transition-all">{parent.name}</h3>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                                                    <Shield size={12} className={parent.is_active ? 'text-emerald-500' : 'text-rose-500'} />
                                                    <span className={parent.is_active ? 'text-emerald-600' : 'text-rose-600'}>
                                                        {parent.is_active ? 'حساب نشط' : 'حساب معطل'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => printCredentials(parent.name, parent.username || parent.national_id, null, logoUrl)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={() => handleResetPassword(parent.id)} className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
                                                <KeyRound size={16} />
                                            </button>
                                            <Link href={route('academic.parents.edit', parent.id)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center hover:bg-blue-50 transition-colors" title="تعديل">
                                                <Edit size={16} />
                                            </Link>
                                            <button onClick={() => handleDelete(parent.id)} className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center justify-center hover:bg-rose-50 transition-colors" title="حذف">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-5 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 grow">
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 flex justify-center text-slate-400"><Phone size={16} /></div>
                                            <span className="text-slate-700 dark:text-slate-300" dir="ltr">{parent.phone || 'غير مسجل'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 flex justify-center text-slate-400"><UserCheck size={16} /></div>
                                            <span className="text-slate-700 dark:text-slate-300">{parent.username || parent.national_id || 'غير متوفر'}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm">
                                            <div className="w-6 flex justify-center text-slate-400"><MapPin size={16} /></div>
                                            <span className="text-slate-700 dark:text-slate-300 truncate">{parent.address || 'غير مسجل'}</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4 mt-auto">
                                        <p className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-1.5">
                                            <Users size={14} /> الأبناء المسجلين ({parent.children?.length || 0})
                                        </p>
                                        {parent.children && parent.children.length > 0 ? (
                                            <div className="flex flex-wrap gap-2">
                                                {parent.children.map(child => (
                                                    <span key={child.id} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-primary-50 text-primary-700 border border-primary-100 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20">
                                                        {child.user?.name.split(' ')[0] || 'طالب'} ({child.pivot?.relationship_type || 'ابن'})
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-slate-500 italic">لا يوجد أبناء مسجلين باسمه</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-sm font-bold">
                                        <tr>
                                            <th className="px-6 py-4">ولي الأمر</th>
                                            <th className="px-6 py-4">رقم الهوية / المستخدم</th>
                                            <th className="px-6 py-4">الجوال</th>
                                            <th className="px-6 py-4">الأبناء</th>
                                            <th className="px-6 py-4">الحالة</th>
                                            <th className="px-6 py-4 text-left">الإجراءات</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {parents.data.map((parent) => (
                                            <tr key={parent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold shadow-inner shrink-0">
                                                            {parent.name.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-900 dark:text-white">{parent.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm font-medium">
                                                    {parent.username || parent.national_id}
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-sm" dir="ltr">
                                                    {parent.phone || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1">
                                                        {parent.children && parent.children.length > 0 ? (
                                                            parent.children.map((child, idx) => (
                                                                <span key={child.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium border border-slate-200 dark:border-slate-600">
                                                                    {child.user?.name.split(' ')[0] || 'طالب'} {idx < parent.children.length - 1 ? '، ' : ''}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold ${parent.is_active ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${parent.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                                        {parent.is_active ? 'نشط' : 'معطل'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button onClick={() => printCredentials(parent.name, parent.username || parent.national_id, null, logoUrl)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                                            <Printer size={16} />
                                                        </button>
                                                        <button onClick={() => handleResetPassword(parent.id)} className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
                                                            <KeyRound size={16} />
                                                        </button>
                                                        <Link href={route('academic.parents.edit', parent.id)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors" title="تعديل">
                                                            <Edit size={16} />
                                                        </Link>
                                                        <button onClick={() => handleDelete(parent.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors" title="حذف">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-3xl">
                        <Users size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                        <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">لا يوجد أولياء أمور</h3>
                        <p className="text-sm text-slate-500">لم يتم العثور على نتائج تطابق بحثك.</p>
                    </div>
                )}

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
