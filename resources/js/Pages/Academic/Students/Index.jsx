import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, Search, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Building2, BookOpen, ShieldAlert, Printer, RotateCcw, Upload, LayoutGrid, List, KeyRound } from 'lucide-react';
import Swal from 'sweetalert2';
import SelectInput from '@/Components/SelectInput';
import ImportModal from './Components/ImportModal';

// ─── Helper: Print Template ───────────────────────────────────────────────────
const printCredentials = (credentialsData, logoUrl = '') => {
    const credentials = Array.isArray(credentialsData) ? credentialsData : [credentialsData];
    const printWindow = window.open('', '_blank');
    const dateStr = new Date().toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
    
    const logoHtml = logoUrl 
        ? '<img src="' + logoUrl + '" class="logo" />'
        : '<svg class="logo-svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>';

    let cardsHtml = '';
    credentials.forEach(cred => {
        const pwdDisplay = cred.password ? cred.password : '<span style="color:#94a3b8; letter-spacing:4px; font-size:18px;">••••••••</span>';
        const pwdNote = cred.password 
            ? 'الرجاء الاحتفاظ بهذه الورقة في مكان آمن وعدم مشاركتها مع أي شخص.'
            : 'كلمة المرور مخفية لدواعي أمنية. في حال فقدانها يرجى طلب إعادة تعيين من الإدارة.';
        
        cardsHtml += `
            <div class="print-card" style="page-break-after: always; margin-bottom: 40px;">
                <div class="print-header">
                    <div class="logo-container">${logoHtml}</div>
                    <h1 class="document-title">بطاقة الطالب</h1>
                    <p class="document-subtitle">وثيقة تسليم بيانات الدخول النظام</p>
                </div>
                
                <div class="print-body">
                    <div class="watermark">سري وخاص</div>
                    <div class="employee-section">
                        <div class="greeting">الطالب/ة،</div>
                        <h2 class="employee-name">${cred.name}</h2>
                    </div>

                    <div class="credentials-grid">
                        <div class="cred-box">
                            <div class="cred-label">
                                <svg class="cred-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                اسم المستخدم:
                            </div>
                            <div class="cred-value">${cred.username}</div>
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
                        <div class="date-stamp">تاريخ الإصدار: ${dateStr}</div>
                    </div>
                </div>
            </div>
        `;
    });

    printWindow.document.write(`
        <html dir="rtl">
        <head>
            <title>طباعة بيانات الدخول</title>
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
                    margin: 0;
                    padding: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    min-height: 100vh;
                }
                
                .print-card {
                    background: #ffffff;
                    width: 100%;
                    max-width: 800px;
                    border-radius: 20px;
                    box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.1);
                    overflow: hidden;
                    position: relative;
                    border: 1px solid var(--gray-border);
                    margin-bottom: 40px;
                }

                .print-card:last-child {
                    page-break-after: auto !important;
                    margin-bottom: 0;
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

                .logo { width: 50px; height: 50px; object-fit: contain; }
                .logo-svg { width: 40px; height: 40px; color: var(--secondary); }

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

                .greeting { color: var(--gray-text); font-size: 16px; margin-bottom: 5px; }

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

                .cred-icon { width: 22px; height: 22px; opacity: 0.8; }

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
                
                .date-stamp { color: var(--gray-text); font-weight: 500; }

                @media print { 
                    body { background: #fff; padding: 0; } 
                    .print-card { box-shadow: none; border: none; margin: 0; border-radius: 0; max-width: 100%; }
                    * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
                }
            </style>
        </head>
        <body>
            ${cardsHtml}
            <script>
                window.onload = function() { setTimeout(function() { window.print(); window.close(); }, 800); }
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
};

export default function StudentsIndex({ students, academicYears, sections }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showImportModal, setShowImportModal] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    
    // Filters
    const urlParams = new URLSearchParams(window.location.search);
    const [selectedYear, setSelectedYear] = useState(urlParams.get('academic_year_id') || '');
    const [selectedSection, setSelectedSection] = useState(urlParams.get('section_id') || '');
    const { flash, appSettings } = usePage().props;
    const logoUrl = appSettings?.logo_url || '';

    // Auto-trigger print if credentials were generated
    useEffect(() => {
        if (flash?.generated_credentials) {
            const { name, username, password } = flash.generated_credentials;
            const isReset = flash.success && flash.success.includes('إعادة تعيين');
            Swal.fire({
                title: isReset ? 'تم إعادة تعيين كلمة المرور بنجاح' : 'تم إنشاء الحساب بنجاح',
                html: `
                    <div class="text-right space-y-4 mb-4">
                        <p class="text-sm text-slate-500">تم إنشاء حساب للطالب وتوليد بيانات الدخول. هل ترغب في طباعتها الآن؟</p>
                        <div class="bg-slate-50 p-4 rounded-xl border border-slate-200">
                            <div class="font-mono text-lg text-slate-800" dir="ltr"><span class="text-slate-400 select-none mr-2">👤</span>${username}</div>
                            <div class="font-mono text-lg text-slate-800 mt-2" dir="ltr"><span class="text-slate-400 select-none mr-2">🔑</span>${password}</div>
                        </div>
                    </div>
                `,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: '🖨️ طباعة البيانات',
                cancelButtonText: 'إغلاق',
                confirmButtonColor: '#0ea5e9'
            }).then((result) => {
                if (result.isConfirmed) {
                    printCredentials({ name, username, password }, logoUrl);
                }
            });
        }
    }, [flash]);

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

    const handleResetPassword = (id) => {
        Swal.fire({
            title: 'إعادة تعيين كلمة المرور',
            text: "هل أنت متأكد من إعادة تعيين كلمة مرور هذا الطالب؟",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'نعم، أعد التعيين',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('academic.students.reset-password', id), {}, {
                    preserveScroll: true,
                });
            }
        });
    };

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
                            <div className="w-14 h-14 bg-white dark:bg-slate-800 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_-5px_rgba(0,0,0,0.05)] border border-slate-100 dark:border-slate-700">
                                <GraduationCap size={28} strokeWidth={1.5} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">سجل الطلاب</h1>
                                <p className="text-sm font-semibold text-primary-700/80 dark:text-primary-300/80 mt-1">إدارة ملفات الطلاب وسجلاتهم الأكاديمية</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowImportModal(true)}
                                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 px-5 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 shrink-0 active:scale-95"
                            >
                                <Upload size={18} />
                                <span>استيراد من ملف إكسل</span>
                            </button>
                            <Link
                                href={route('academic.students.create')}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/30 transition-all hover:-translate-y-0.5 shrink-0 active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل طالب جديد</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 relative z-10">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                            <Users size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الطلاب المطابقين للبحث</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{students.total}</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <Building2 size={26} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">الأقسام التعليمية</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{sections.length}</p>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 md:p-6 border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 flex flex-col lg:flex-row gap-4">
                    <div className="relative group flex-1">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب أو الهوية..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-2xl px-10 py-3 text-sm font-semibold outline-none transition-all dark:text-white placeholder:text-slate-400"
                        />
                    </div>
                    
                    <div className="w-full lg:w-64 shrink-0">
                        <SelectInput
                            options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                            value={selectedYear}
                            onChange={setSelectedYear}
                            placeholder="كل السنوات الدراسية"
                        />
                    </div>

                    <div className="w-full lg:w-64 shrink-0">
                        <SelectInput
                            options={sections.map(s => ({ value: s.id, label: s.name }))}
                            value={selectedSection}
                            onChange={setSelectedSection}
                            placeholder="كل الأقسام والمراحل"
                        />
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 h-12">
                        <button
                            onClick={() => setViewMode('table')}
                            className={`flex items-center justify-center px-4 rounded-lg font-bold transition-all ${
                                viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                            title="عرض كجدول"
                        >
                            <List size={20} />
                        </button>
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`flex items-center justify-center px-4 rounded-lg font-bold transition-all ${
                                viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                            }`}
                            title="عرض كبطاقات"
                        >
                            <LayoutGrid size={20} />
                        </button>
                    </div>
                </div>

                {/* Students View */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {students.data.length > 0 ? (
                        students.data.map((student) => {
                            const enroll = student.current_enrollment;
                            
                            return (
                                <div key={student.id} className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col h-full">
                                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
                                        <Link href={route('academic.students.edit', student.id)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors">
                                            <Edit size={16} />
                                        </Link>
                                        <button onClick={() => handleDelete(student.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors tooltip" title="حذف الطالب">
                                            <Trash2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => printCredentials({ name: student.user.name, username: student.user.username }, logoUrl)}
                                            className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                            <Printer size={16} />
                                        </button>
                                        <button 
                                            onClick={() => {
                                                Swal.fire({
                                                    title: 'إعادة تعيين كلمة المرور',
                                                    text: 'سيتم توليد كلمة مرور جديدة عشوائية لهذا الطالب، هل أنت متأكد؟',
                                                    icon: 'warning',
                                                    showCancelButton: true,
                                                    confirmButtonText: 'نعم، أعد التعيين',
                                                    cancelButtonText: 'إلغاء'
                                                }).then(result => {
                                                    if (result.isConfirmed) {
                                                        router.post(route('academic.students.reset-password', student.id));
                                                    }
                                                });
                                            }}
                                            className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
                                            <RotateCcw size={16} />
                                        </button>
                                    </div>

                                    <div className="flex items-center gap-4 mb-5">
                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl border border-primary-200/50 dark:border-primary-500/20 shrink-0 shadow-inner">
                                            {student.user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white line-clamp-1 pr-12 group-hover:pr-0 transition-all">{student.user.name}</h3>
                                            <span className="text-xs text-slate-500 font-mono mt-1 block">@{student.user.username}</span>
                                        </div>
                                    </div>

                                    {/* Academic Status Widget */}
                                    <div className="mb-5 p-4 rounded-2xl bg-primary-50 dark:bg-primary-500/5 border border-primary-100/50 dark:border-primary-500/10 flex-grow">
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
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400">{enroll.academic_year?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <Building2 size={16} className="text-primary-400" />
                                                    <span className="font-medium">{enroll.division?.grade?.section?.name}</span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                    <BookOpen size={16} className="text-primary-400" />
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
                                        <div className="flex gap-3 items-center">
                                            <Link href={route('academic.students.grade-report', student.id)} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">
                                                كشف الدرجات
                                            </Link>
                                            <Link href={route('academic.students.edit', student.id)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
                                                الملف الكامل &larr;
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
                            <GraduationCap size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
                            <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">لا يوجد طلاب</h3>
                            <p className="text-sm text-slate-500">لم يتم العثور على أي طلاب مطابقين لبحثك.</p>
                        </div>
                    )}
                </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                                        <th className="p-4 font-bold text-sm">الطالب</th>
                                        <th className="p-4 font-bold text-sm">الحالة الأكاديمية</th>
                                        <th className="p-4 font-bold text-sm">المرحلة والصف</th>
                                        <th className="p-4 font-bold text-sm text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.data.length > 0 ? (
                                        students.data.map((student) => {
                                            const enroll = student.current_enrollment;
                                            return (
                                                <tr key={student.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg shrink-0">
                                                                {student.user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">{student.user.name}</h3>
                                                                <span className="text-xs text-slate-500 font-mono">@{student.user.username}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {enroll ? (
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                                enroll.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                                enroll.status === 'transferred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                                'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                            }`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${
                                                                    enroll.status === 'active' ? 'bg-emerald-500' :
                                                                    enroll.status === 'transferred' ? 'bg-amber-500' :
                                                                    'bg-rose-500'
                                                                }`} />
                                                                {enroll.status === 'active' ? 'نشط' : enroll.status === 'transferred' ? 'منقول' : 'مسحوب/خريج'}
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                <ShieldAlert size={12} /> غير مسجل
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        {enroll ? (
                                                            <div>
                                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                                    {enroll.division?.grade?.section?.name}
                                                                </p>
                                                                <p className="text-xs text-slate-500 mt-0.5">
                                                                    {enroll.division?.grade?.name} - {enroll.division?.name}
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-sm">-</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Link href={route('academic.students.edit', student.id)} className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors tooltip" title="تعديل الطالب">
                                                                <Edit size={16} />
                                                            </Link>
                                                            <button onClick={() => printCredentials({ name: student.user.name, username: student.user.username }, logoUrl)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                                                <Printer size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    Swal.fire({
                                                                        title: 'إعادة تعيين كلمة المرور',
                                                                        text: 'سيتم توليد كلمة مرور جديدة عشوائية، هل أنت متأكد؟',
                                                                        icon: 'warning',
                                                                        showCancelButton: true,
                                                                        confirmButtonText: 'نعم',
                                                                        cancelButtonText: 'إلغاء'
                                                                    }).then(result => {
                                                                        if (result.isConfirmed) {
                                                                            router.post(route('academic.students.reset-password', student.id));
                                                                        }
                                                                    });
                                                                }}
                                                                className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
                                                                <RotateCcw size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(student.id)} className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors tooltip" title="حذف">
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="4" className="p-12 text-center">
                                                <GraduationCap size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
                                                <h3 className="text-lg font-bold text-slate-700 dark:text-white mb-1">لا يوجد طلاب</h3>
                                                <p className="text-sm text-slate-500">لم يتم العثور على أي طلاب مطابقين لبحثك.</p>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

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

            <ImportModal 
                show={showImportModal} 
                onClose={() => setShowImportModal(false)} 
                onSuccess={(importedCredentials) => {
                    setShowImportModal(false);
                    if (importedCredentials && importedCredentials.length > 0) {
                        Swal.fire({
                            title: 'اكتمل الاستيراد والتوليد',
                            text: `تم استيراد ${importedCredentials.length} طالب، وتم توليد أرقام أكاديمية وكلمات مرور لهم بنجاح. هل ترغب في طباعة البطاقات المجمعة لتوزيعها؟`,
                            icon: 'success',
                            showCancelButton: true,
                            confirmButtonText: '🖨️ طباعة البطاقات',
                            cancelButtonText: 'إغلاق',
                            confirmButtonColor: '#0ea5e9'
                        }).then((result) => {
                            if (result.isConfirmed) {
                                printCredentials(importedCredentials, logoUrl);
                            }
                        });
                    }
                }}
            />
        </AdminLayout>
    );
}
