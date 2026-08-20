import React, { useState, useRef, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import ExcelJS from 'exceljs';
import { 
    Search, Plus, Filter, Mail, Building, ShieldCheck,
    MoreVertical, Edit2, Trash2, X, Check, Users, Calendar, 
    AlertTriangle, LayoutGrid, List, Download, Printer, RotateCcw,
    ArrowUpDown, ArrowUp, ArrowDown, UserCheck, UserX, CheckCircle2,
    XCircle, ChevronDown, ArrowUpRight, ArrowDownRight, Upload
} from 'lucide-react';
import ImportModal from './Components/ImportModal';
import Swal from 'sweetalert2';

// ─── Helper: Print Template ───────────────────────────────────────────────────
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

    printWindow.document.write(`
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
    `);
    printWindow.document.close();
};

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-lg z-10 overflow-hidden border border-white/20 dark:border-slate-800/80 animate-scale-in">
                <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-bold text-slate-850 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">✕</button>
                </div>
                <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({ emp }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);
    const handlePrint = (e) => {
        e.stopPropagation();
        setOpen(false);
        const name = emp.name || 'مجهول';
        const username = emp.username || 'مجهول';
        
        // Use the global window object to find logo_url if needed, or pass empty string
        const logoUrl = document.querySelector('link[rel="icon"]')?.href || '';
        printCredentials(name, username, null, logoUrl);
    };

    return (
        <div ref={ref} className="relative">
            <button onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
                className="text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 p-2 rounded-xl hover:bg-primary-50/70 dark:hover:bg-primary-500/10 transition-colors inline-flex border border-transparent">
                <MoreVertical size={18} />
            </button>
            {open && (
                <div className="absolute left-0 top-full mt-1.5 w-48 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 z-20 overflow-hidden animate-slide-down">
                    <button onClick={handlePrint} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right">
                        <Printer size={14} className="text-indigo-500" /> طباعة بيانات الدخول
                    </button>
                    <Link href={route('hr.employees.reset-password', emp.id)} method="post" as="button" preserveScroll className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right">
                        <RotateCcw size={14} className="text-emerald-500" /> إعادة تعيين كلمة المرور
                    </Link>
                    <div className="border-t border-slate-100 dark:border-slate-800 my-1"></div>
                    <Link href={route('hr.employees.edit', emp.id)} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right">
                        <Edit2 size={14} className="text-primary-500" /> تعديل البيانات
                    </Link>
                    <Link href={route('hr.leaves', { employee_id: emp.id })} className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors text-right">
                        <Calendar size={14} className="text-amber-500" /> سجل الإجازات
                    </Link>
                    <Link href={route('hr.employees.destroy', emp.id)} method="delete" as="button" className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-semibold text-accent-600 dark:text-accent-400 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors text-right">
                        <Trash2 size={14} /> حذف الموظف
                    </Link>
                </div>

            )}
        </div>
    );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function Pagination({ data }) {
    if (!data || data.last_page <= 1) return null;
    return (
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-900/30 flex-wrap gap-3">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-sans">
                عرض {data.from ?? 0} إلى {data.to ?? 0} من أصل {data.total} موظف
            </p>
            <div className="flex items-center gap-1.5 flex-wrap font-sans" dir="ltr">
                {data.links.map((link, i) => (
                    <button key={i} disabled={!link.url || link.active}
                        onClick={() => link.url && router.get(link.url, {}, { preserveScroll: true })}
                        className={`px-3.5 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ${
                            link.active
                                ? 'bg-primary-500 text-white border-primary-500 shadow-sm dark:bg-primary-600 dark:border-primary-600'
                                : link.url
                                    ? 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600 dark:hover:text-primary-400'
                                    : 'bg-white dark:bg-slate-950 text-slate-300 dark:text-slate-650 border-slate-100 dark:border-slate-850/50 cursor-not-allowed'
                        }`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function EmployeesIndex({ employees, stats, departments, jobGrades, filters }) {
    const { flash, logo_url } = usePage().props;
    
    // Safety check for filters properties
    const getFilterVal = (key, fallback = '') => {
        if (!filters || Array.isArray(filters)) return fallback;
        const val = filters[key];
        return typeof val === 'string' || typeof val === 'number' ? String(val) : fallback;
    };

    const [searchValue, setSearch] = useState(getFilterVal('search'));
    const [deptFilter, setDeptFilter] = useState(getFilterVal('department_id'));
    const [gradeFilter, setGradeFilter] = useState(getFilterVal('job_grade_id'));
    const [statusValue, setStatusValue] = useState(getFilterVal('status', 'all'));
    const [hireDateStart, setHireDateStart] = useState(getFilterVal('hire_date_start'));
    const [hireDateEnd, setHireDateEnd] = useState(getFilterVal('hire_date_end'));
    const [sortBy, setSortBy] = useState(getFilterVal('sort_by', 'hire_date'));
    const [sortDir, setSortDir] = useState(getFilterVal('sort_dir', 'desc'));

    const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
    const [showFilters, setShowFilters] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const searchInputRef = useRef(null);
    const isFirstRender = useRef(true);

    // Column visibility toggle states
    const [visibleColumns, setVisibleColumns] = useState({
        employee: true,
        email: true,
        details: true,
        hire_date: true,
        status: true,
        actions: true
    });
    const [showColumnToggle, setShowColumnToggle] = useState(false);
    const columnToggleRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (columnToggleRef.current && !columnToggleRef.current.contains(e.target)) {
                setShowColumnToggle(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Check for generated credentials flash message
    useEffect(() => {
        if (flash?.generated_credentials) {
            const { name, username, password } = flash.generated_credentials;
            Swal.fire({
                title: 'تم إنشاء الحساب بنجاح!',
                html: `
                    <div class="text-right" dir="rtl">
                        <p class="mb-4 text-sm text-slate-500 dark:text-slate-400">تم توليد بيانات الدخول للموظف <b>${name}</b> آلياً:</p>
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <div class="flex justify-between items-center mb-3">
                                <span class="text-slate-500 dark:text-slate-400 text-sm">اسم المستخدم:</span>
                                <span class="font-mono font-bold text-slate-800 dark:text-slate-200 text-lg" dir="ltr">${username}</span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span class="text-slate-500 dark:text-slate-400 text-sm">كلمة المرور:</span>
                                <span class="font-mono font-bold text-slate-800 dark:text-slate-200 text-lg" dir="ltr">${password}</span>
                            </div>
                        </div>
                    </div>
                `,
                icon: 'success',
                confirmButtonText: 'حسناً',
                showCancelButton: true,
                cancelButtonText: 'نسخ',
                cancelButtonColor: '#3b82f6',
                showDenyButton: true,
                denyButtonText: 'طباعة',
                denyButtonColor: '#64748b',
                customClass: {
                    container: 'font-sans',
                    popup: 'dark:bg-slate-900 dark:border dark:border-slate-800',
                    title: 'text-xl font-bold dark:text-white',
                    actions: 'gap-2 flex-wrap'
                }
            }).then((result) => {
                if (result.isDenied) {
                    printCredentials(name, username, password, logo_url);
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    navigator.clipboard.writeText(`اسم المستخدم: ${username}\nكلمة المرور: ${password}`);
                    Swal.fire({
                        title: 'تم النسخ!',
                        text: 'تم نسخ بيانات الدخول إلى الحافظة بنجاح.',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false,
                        customClass: {
                            popup: 'dark:bg-slate-900 dark:border dark:border-slate-800',
                            title: 'dark:text-white',
                            htmlContainer: 'dark:text-slate-300'
                        }
                    });
                }
            });
        }
    }, [flash?.generated_credentials]);


    // Keyboard Shortcut (/) to focus search
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === '/' && document.activeElement !== searchInputRef.current) {
                const target = e.target;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    return;
                }
                e.preventDefault();
                searchInputRef.current?.focus();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const applyFilters = (updates) => {
        const params = {
            search: updates.hasOwnProperty('search') ? updates.search : searchValue,
            department_id: updates.hasOwnProperty('department_id') ? updates.department_id : deptFilter,
            job_grade_id: updates.hasOwnProperty('job_grade_id') ? updates.job_grade_id : gradeFilter,
            status: updates.hasOwnProperty('status') ? updates.status : statusValue,
            hire_date_start: updates.hasOwnProperty('hire_date_start') ? updates.hire_date_start : hireDateStart,
            hire_date_end: updates.hasOwnProperty('hire_date_end') ? updates.hire_date_end : hireDateEnd,
            sort_by: updates.hasOwnProperty('sort_by') ? updates.sort_by : sortBy,
            sort_dir: updates.hasOwnProperty('sort_dir') ? updates.sort_dir : sortDir,
        };

        // Clean empty parameters
        Object.keys(params).forEach(key => {
            if (params[key] === '' || params[key] === null || params[key] === undefined || (key === 'status' && params[key] === 'all')) {
                delete params[key];
            }
        });

        router.get(route('hr.employees'), params, { preserveState: true, replace: true });
    };

    // Debounce for input fields (search, hire_date_start, hire_date_end)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delay = setTimeout(() => {
            applyFilters({});
        }, 400);
        return () => clearTimeout(delay);
    }, [searchValue, hireDateStart, hireDateEnd]);

    const handleDeptChange = (val) => {
        setDeptFilter(val);
        applyFilters({ department_id: val });
    };

    const handleGradeChange = (val) => {
        setGradeFilter(val);
        applyFilters({ job_grade_id: val });
    };

    const handleStatusChange = (val) => {
        setStatusValue(val);
        applyFilters({ status: val });
    };

    const handleSort = (field) => {
        const isAsc = sortBy === field && sortDir === 'asc';
        const newDir = isAsc ? 'desc' : 'asc';
        setSortBy(field);
        setSortDir(newDir);
        applyFilters({ sort_by: field, sort_dir: newDir });
    };

    const resetAllFilters = () => {
        setSearch('');
        setDeptFilter('');
        setGradeFilter('');
        setStatusValue('all');
        setHireDateStart('');
        setHireDateEnd('');
        setSortBy('hire_date');
        setSortDir('desc');
        router.get(route('hr.employees'), {}, { preserveState: true, replace: true });
    };

    const toggleStatus = (emp) => {
        router.patch(route('hr.employees.quick-update', emp.id), {
            is_active: !emp.is_active
        }, { preserveScroll: true });
    };

    const [isExporting, setIsExporting] = useState(false);

    const exportToExcel = async () => {
        if (empData.length === 0) return;

        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('دليل الموظفين', {
                views: [{ rightToLeft: true, state: 'frozen', ySplit: 9 }],
                pageSetup: {
                    paperSize: 9,
                    orientation: 'landscape',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
                },
                headerFooter: {
                    oddFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - إدارة النظام',
                    evenFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - إدارة النظام'
                }
            });

            // Logo Fetching
            let logoId = null;
            const logoPath = logo_url || '/images/logo.png';
            const getLogoBase64 = async (url) => {
                try {
                    const response = await fetch(url);
                    if (response.ok) {
                        const blob = await response.blob();
                        if (blob.type.startsWith('image/')) {
                            const reader = new FileReader();
                            return await new Promise((resolve) => {
                                reader.readAsDataURL(blob);
                                reader.onloadend = () => resolve(reader.result);
                            });
                        }
                    }
                } catch (e) {}
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            };

            const base64Clean = await getLogoBase64(logoPath);
            if (base64Clean) {
                logoId = workbook.addImage({ base64: base64Clean, extension: 'png' });
            }

            // Columns layout matching header below
            sheet.columns = [
                { width: 15 }, // ID
                { width: 40 }, // Name
                { width: 25 }, // Email/Username
                { width: 25 }, // Dept
                { width: 20 }, // Grade
                { width: 20 }, // Hire Date
                { width: 15 }  // Status
            ];

            sheet.getRow(1).height = 10;
            sheet.mergeCells('A1:G1');
            sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

            sheet.getRow(2).height = 35;
            sheet.getRow(3).height = 25;
            sheet.getRow(4).height = 20;

            if (logoId !== null) {
                sheet.addImage(logoId, { tl: { col: 3.3, row: 1.1 }, ext: { width: 85, height: 85 } });
            }

            sheet.mergeCells('A2:C2');
            const titleCell = sheet.getCell('A2');
            titleCell.value = 'مدارس القيم الأهلية';
            titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF6B9B37' } }; 
            titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells('A3:C3');
            const enTitleCell = sheet.getCell('A3');
            enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
            enTitleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FF6B9B37' } }; 
            enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells('A4:C4');
            const subTitleCell = sheet.getCell('A4');
            subTitleCell.value = 'النظام الإداري - دليل الموظفين';
            subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } }; 
            subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells('E2:G2');
            const meta1Cell = sheet.getCell('E2');
            meta1Cell.value = 'نوع التقرير: كشف الموظفين';
            meta1Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            meta1Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            const exportDate = new Date().toLocaleString('ar-EG');
            sheet.mergeCells('E3:G3');
            const meta2Cell = sheet.getCell('E3');
            meta2Cell.value = `تاريخ التصدير: ${exportDate}`;
            meta2Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            meta2Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.mergeCells('E4:G4');
            const meta3Cell = sheet.getCell('E4');
            meta3Cell.value = 'حالة التقرير: معتمد ✔';
            meta3Cell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
            meta3Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.getRow(5).height = 15;

            sheet.getRow(7).height = 30;
            sheet.mergeCells('A7:G7');
            const statsCell = sheet.getCell('A7');
            statsCell.value = `📊 إجمالي الموظفين: ${stats?.total || 0}   |   ✅ النشطون: ${stats?.active || 0}   |   ⚠️ المعطلون: ${stats?.inactive || 0}`;
            statsCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
            statsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } };
            statsCell.border = { top: { style: 'medium', color: { argb: 'FF96CF75' } }, bottom: { style: 'medium', color: { argb: 'FF96CF75' } }, left: { style: 'medium', color: { argb: 'FF96CF75' } }, right: { style: 'medium', color: { argb: 'FF96CF75' } } };

            sheet.getRow(8).height = 10;

            const headerRow = sheet.addRow(["الرقم الوظيفي", "اسم الموظف", "البريد الإلكتروني", "القسم", "الدرجة الوظيفية", "تاريخ التعيين", "الحالة"]);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
                cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
            });

            empData.forEach((emp, index) => {
                const row = sheet.addRow([
                    emp.id || index + 1,
                    emp.name,
                    `${emp.username}@school.com`,
                    emp.department || '-',
                    emp.jobGrade || '-',
                    emp.hire_date || '-',
                    emp.is_active ? 'نشط' : 'معطل'
                ]);

                row.height = 35;
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    
                    if (colNumber === 1 && typeof cell.value === 'number') {
                        cell.numFmt = '0000';
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF475569' } };
                    }
                });

                if (index % 2 === 0) {
                    row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FCF7' } });
                }

                const statusCell = row.getCell(7);
                if (emp.is_active) {
                    statusCell.font = { color: { argb: 'FF558A2A' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEFD1' } };
                } else {
                    statusCell.font = { color: { argb: 'FFCC2B2B' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
                }
            });

            sheet.autoFilter = `A9:G${9 + empData.length}`;
            await sheet.protect('', { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true, sort: true, formatCells: true, formatColumns: true, formatRows: true });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `employees_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            alert("حدث خطأ أثناء التصدير.");
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const empData = employees?.data ?? [];

    const statCards = stats ? [
        {
            title: 'إجمالي الموظفين',
            value: stats.total ?? 0,
            icon: Users,
            color: 'primary',
            iconBg: 'bg-primary-50 text-primary-600 dark:bg-primary-950/20 dark:text-primary-400',
            progressWidth: '100%',
            progressColor: 'bg-gradient-to-r from-primary-400 to-primary-600',
            glowBg: 'bg-primary-500/5',
            hoverBorder: 'hover:border-primary-200 dark:hover:border-primary-800/30',
            topLineHover: 'group-hover:bg-primary-500/20',
            ringColor: 'border-primary-500/20',
            badgeClass: 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border-primary-100/30 dark:border-primary-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: '100%',
            subText: 'من إجمالي موظفي المدرسة'
        },
        {
            title: 'الموظفون النشطون',
            value: stats.active ?? 0,
            icon: CheckCircle2,
            color: 'emerald',
            iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400',
            progressWidth: stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-emerald-400 to-emerald-600',
            glowBg: 'bg-emerald-500/5',
            hoverBorder: 'hover:border-emerald-200 dark:hover:border-emerald-800/30',
            topLineHover: 'group-hover:bg-emerald-500/20',
            ringColor: 'border-emerald-500/20',
            badgeClass: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100/30 dark:border-emerald-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.active / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة الموظفين النشطين'
        },
        {
            title: 'الموظفون المعطلون',
            value: stats.inactive ?? 0,
            icon: XCircle,
            color: 'accent',
            iconBg: 'bg-accent-50 text-accent-600 dark:bg-accent-950/20 dark:text-accent-400',
            progressWidth: stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-accent-400 to-accent-600',
            glowBg: 'bg-accent-500/5',
            hoverBorder: 'hover:border-accent-200 dark:hover:border-accent-800/30',
            topLineHover: 'group-hover:bg-accent-500/20',
            ringColor: 'border-accent-500/20',
            badgeClass: 'bg-accent-50 dark:bg-accent-500/10 text-accent-700 dark:text-accent-400 border-accent-100/20 dark:border-accent-500/20',
            badgeIcon: <ArrowDownRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.inactive / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة الموظفين المعطلين'
        },
        {
            title: 'المعينون هذا الشهر',
            value: stats.new_hires ?? 0,
            icon: Calendar,
            color: 'dark',
            iconBg: 'bg-dark-100 text-dark-700 dark:bg-dark-900/40 dark:text-dark-300',
            progressWidth: stats.total > 0 ? `${((stats.new_hires / stats.total) * 100).toFixed(1)}%` : '0%',
            progressColor: 'bg-gradient-to-r from-dark-500 to-dark-700 dark:from-dark-400 dark:to-dark-600',
            glowBg: 'bg-dark-500/5',
            hoverBorder: 'hover:border-dark-300 dark:hover:border-dark-800/30',
            topLineHover: 'group-hover:bg-dark-500/20',
            ringColor: 'border-dark-500/20',
            badgeClass: 'bg-dark-100 dark:bg-dark-500/10 text-dark-800 dark:text-dark-300 border-dark-200/30 dark:border-dark-500/20',
            badgeIcon: <ArrowUpRight size={10} strokeWidth={3} />,
            badgeText: stats.total > 0 ? `${((stats.new_hires / stats.total) * 100).toFixed(0)}%` : '0%',
            subText: 'نسبة التعيينات الجديدة'
        }
    ] : [];

    const hasActiveFilters = 
        searchValue !== '' ||
        deptFilter !== '' ||
        gradeFilter !== '' ||
        statusValue !== 'all' ||
        hireDateStart !== '' ||
        hireDateEnd !== '' ||
        sortBy !== 'hire_date' ||
        sortDir !== 'desc';

    return (
        <AdminLayout activeMenu="دليل الموظفين">
            <Head title="دليل الموظفين | النظام الإداري" />

            <div className="screen-only-content space-y-8 animate-fade-in">
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50/80 dark:bg-emerald-500/10 backdrop-blur border border-emerald-250 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-5 py-3.5 rounded-2xl text-sm font-semibold animate-slide-down shadow-sm">
                        <Check size={16} /> {flash.success}
                    </div>
                )}

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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">دليل الموظفين الإداريين</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة ومتابعة الهيكل التنظيمي لجميع موظفي المدرسة</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={exportToExcel} disabled={isExporting}
                                className="flex items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600 transition-colors shadow-sm disabled:opacity-50"
                                title="تصدير إكسيل">
                                {isExporting ? <RotateCcw size={18} className="animate-spin" /> : <Download size={18} />}
                            </button>
                            <button onClick={handlePrint}
                                className="flex items-center justify-center p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-primary-600 transition-colors shadow-sm"
                                title="طباعة الكشف">
                                <Printer size={18} />
                            </button>
                            <button onClick={() => setShowImportModal(true)}
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 text-slate-650 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-850 hover:text-[#5b8a2d] transition-colors shadow-sm font-bold text-sm">
                                <Upload size={18} />
                                <span className="hidden sm:inline">استيراد</span>
                            </button>
                            <Link href={route('hr.employees.create')} className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95">
                                <Plus size={18} />
                                <span>إضافة موظف جديد</span>
                            </Link>
                        </div>
                    </div>
                </div>

                <ImportModal 
                    show={showImportModal} 
                    onClose={() => setShowImportModal(false)} 
                    onSuccess={() => {
                        setShowImportModal(false);
                        router.reload({ only: ['employees', 'stats'] });
                    }} 
                />

                {/* Stats Dashboard */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        {statCards.map((stat, index) => (
                            <div key={index} className={`bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 p-5 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.015)] dark:shadow-none hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:hover:shadow-none hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between gap-4 relative overflow-hidden group cursor-default bg-[radial-gradient(#f1f5f9_1.2px,transparent_1.2px)] dark:bg-[radial-gradient(#1e293b_1.2px,transparent_1.2px)] [background-size:16px_16px] ${stat.hoverBorder}`}>
                                {/* Glowing ambient light */}
                                <div className={`absolute -left-6 -top-6 w-24 h-24 ${stat.glowBg} rounded-full blur-xl group-hover:scale-150 transition-all duration-500 pointer-events-none`} />
                                <div className={`absolute top-0 right-0 left-0 h-1 bg-transparent ${stat.topLineHover} transition-colors`} />

                                <div className="relative z-10 flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate">{stat.title}</p>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1 leading-none font-mono tracking-tight">{stat.value}</h3>
                                    </div>
                                    <div className={`relative h-11 w-11 rounded-2xl ${stat.iconBg} flex items-center justify-center shrink-0 border border-transparent dark:border-white/5 transition-all duration-350 group-hover:scale-110 group-hover:-rotate-3`}>
                                        {/* Double ring hover overlay */}
                                        <span className={`absolute inset-0 rounded-2xl border ${stat.ringColor} scale-100 group-hover:scale-125 opacity-0 group-hover:opacity-100 transition-all duration-300`} />
                                        <stat.icon size={20} strokeWidth={2.5} />
                                    </div>
                                </div>
                                
                                {/* Progress bar and trend badge */}
                                <div className="relative z-10 space-y-2.5 mt-1">
                                    <div className="w-full bg-slate-100/80 dark:bg-slate-950 h-1.5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all duration-1000 ease-out ${stat.progressColor}`} style={{ width: stat.progressWidth }} />
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold">
                                        <div className={`inline-flex items-center gap-0.5 px-2.5 py-1 rounded-full border ${stat.badgeClass}`}>
                                            {stat.badgeIcon}
                                            <span>{stat.badgeText}</span>
                                        </div>
                                        <span className="text-slate-400 dark:text-slate-505">{stat.subText}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Search & Filter Panel */}
                <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl p-5 shadow-sm relative z-40">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md group">
                            <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-405 group-focus-within:text-primary-500 transition-colors" />
                            <input 
                                ref={searchInputRef}
                                type="text" 
                                placeholder="ابحث باسم الموظف... (اضغط / للتركيز)"
                                className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl pr-11 pl-12 py-3 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 dark:focus:border-primary-500 outline-none transition-all dark:text-white font-semibold"
                                value={searchValue} 
                                onChange={e => setSearch(e.target.value)} 
                            />
                            {searchValue && (
                                <button 
                                    onClick={() => { setSearch(''); applyFilters({ search: '' }); }}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 p-0.5 hover:bg-slate-100 dark:hover:bg-slate-805 rounded-lg text-slate-450 hover:text-slate-650 transition-all">
                                    <X size={14} />
                                </button>
                            )}
                            {!searchValue && (
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 px-1.5 py-0.5 bg-slate-205 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-400 rounded border border-slate-300 dark:border-slate-700 font-bold font-mono group-focus-within:opacity-0 transition-opacity">/</div>
                            )}
                        </div>

                        <div className="flex items-center gap-3 flex-wrap">
                            {/* Grid / Table Toggle */}
                            <div className="flex bg-slate-50 dark:bg-slate-950 p-1 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                <button onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === 'table'
                                            ? 'bg-white dark:bg-slate-900 text-primary-500 dark:text-primary-400 shadow-sm'
                                            : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                    title="عرض الجدول">
                                    <List size={18} />
                                </button>
                                <button onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-xl transition-all ${
                                        viewMode === 'grid'
                                            ? 'bg-white dark:bg-slate-900 text-primary-500 dark:text-primary-400 shadow-sm'
                                            : 'text-slate-450 hover:text-slate-600 dark:hover:text-slate-300'
                                    }`}
                                    title="عرض البطاقات">
                                    <LayoutGrid size={18} />
                                </button>
                            </div>

                            <div className="relative" ref={columnToggleRef}>
                                <button onClick={() => setShowColumnToggle(!showColumnToggle)}
                                    className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold shadow-sm transition-all border ${
                                        showColumnToggle
                                            ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-700 dark:text-primary-400'
                                            : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                                    }`}>
                                    <Users size={16} className={showColumnToggle ? 'text-primary-500' : 'text-slate-500'} />
                                    <span>الأعمدة</span>
                                </button>
                                {showColumnToggle && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-30 p-3 flex flex-col gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 mb-1">تحديد الأعمدة الظاهرة:</span>
                                        {Object.keys(visibleColumns).map((col) => (
                                            <label key={col} className="flex items-center gap-2.5 px-2 py-1 text-xs font-bold text-slate-650 dark:text-slate-350 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 rounded-lg">
                                                <input type="checkbox" checked={visibleColumns[col]}
                                                    onChange={() => setVisibleColumns({...visibleColumns, [col]: !visibleColumns[col]})}
                                                    className="rounded text-primary-500 focus:ring-primary-500/10" />
                                                <span>{
                                                    col === 'employee' ? 'الموظف' :
                                                    col === 'email' ? 'بريد المستخدم' :
                                                    col === 'details' ? 'القسم / الدرجة' :
                                                    col === 'hire_date' ? 'تاريخ التعيين' :
                                                    col === 'status' ? 'الحالة' : 'إجراء'
                                                }</span>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all border ${
                                    showFilters || hasActiveFilters
                                        ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                        : 'bg-white dark:bg-slate-950 border-slate-250 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900'
                                }`}>
                                <Filter size={16} />
                                <span>تصفية متقدمة</span>
                                <ChevronDown size={14} className={`transform transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </button>

                            {hasActiveFilters && (
                                <button onClick={resetAllFilters}
                                    className="flex items-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold text-accent-600 dark:text-accent-400 bg-accent-50 dark:bg-accent-500/10 hover:bg-accent-100 dark:hover:bg-accent-500/20 transition-all border border-accent-100 dark:border-accent-550/10">
                                    <RotateCcw size={16} />
                                    <span>إعادة تعيين</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Expandable Advanced Filters Drawer */}
                    {showFilters && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mt-5 pt-5 border-t border-slate-100 dark:border-slate-800 animate-slide-down">
                            {/* Status Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الحالة التشغيلية</label>
                                <SelectInput 
                                    value={statusValue} 
                                    onChange={val => handleStatusChange(val)}
                                    options={[
                                        { value: 'all', label: 'الكل' },
                                        { value: 'active', label: 'نشط' },
                                        { value: 'inactive', label: 'معطل' }
                                    ]}
                                />
                            </div>

                            {/* Department Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">القسم الإداري</label>
                                <SelectInput 
                                    value={deptFilter} 
                                    onChange={val => handleDeptChange(val)}
                                    options={[
                                        { value: '', label: 'جميع الأقسام' },
                                        ...(departments || []).map(d => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                            </div>

                            {/* Job Grade Filter */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الدرجة الوظيفية</label>
                                <SelectInput 
                                    value={gradeFilter} 
                                    onChange={val => handleGradeChange(val)}
                                    options={[
                                        { value: '', label: 'جميع الدرجات' },
                                        ...(jobGrades || []).map(g => ({ value: g.id, label: g.name }))
                                    ]}
                                />
                            </div>

                            {/* Hire Date Start */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">التعيين من تاريخ</label>
                                <FlatpickrInput 
                                    type="date"
                                    value={hireDateStart}
                                    onChange={date => setHireDateStart(date)}
                                />
                            </div>

                            {/* Hire Date End */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">التعيين إلى تاريخ</label>
                                <FlatpickrInput 
                                    type="date"
                                    value={hireDateEnd}
                                    onChange={date => setHireDateEnd(date)}
                                />
                            </div>
                        </div>
                    )}

                    {/* Active Filter Badges */}
                    {hasActiveFilters && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                            {searchValue && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>البحث: "{searchValue}"</span>
                                    <button onClick={() => { setSearch(''); applyFilters({ search: '' }); }} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {statusValue !== 'all' && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>الحالة: {statusValue === 'active' ? 'نشط' : 'معطل'}</span>
                                    <button onClick={() => handleStatusChange('all')} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {deptFilter && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>القسم: {departments?.find(d => String(d.id) === String(deptFilter))?.name}</span>
                                    <button onClick={() => handleDeptChange('')} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {gradeFilter && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>الدرجة: {jobGrades?.find(g => String(g.id) === String(gradeFilter))?.name}</span>
                                    <button onClick={() => handleGradeChange('')} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {(hireDateStart || hireDateEnd) && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>
                                        التعيين: {hireDateStart ? `من ${hireDateStart}` : ''} {hireDateEnd ? `إلى ${hireDateEnd}` : ''}
                                    </span>
                                    <button onClick={() => { setHireDateStart(''); setHireDateEnd(''); applyFilters({ hire_date_start: '', hire_date_end: '' }); }} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                            {(sortBy !== 'hire_date' || sortDir !== 'desc') && (
                                <span className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold rounded-xl border border-primary-100 dark:border-primary-500/20">
                                    <span>
                                        الترتيب: {
                                            sortBy === 'name' ? 'الاسم' :
                                            sortBy === 'username' ? 'اسم المستخدم' :
                                            sortBy === 'hire_date' ? 'تاريخ التعيين' :
                                            sortBy === 'department_id' ? 'القسم' :
                                            sortBy === 'job_grade_id' ? 'الدرجة' : 'الحالة'
                                        } ({sortDir === 'asc' ? 'تصاعدي' : 'تنازلي'})
                                    </span>
                                    <button onClick={() => { setSortBy('hire_date'); setSortDir('desc'); applyFilters({ sort_by: 'hire_date', sort_dir: 'desc' }); }} className="hover:text-accent-500 transition-colors">
                                        <X size={12} />
                                    </button>
                                </span>
                            )}
                        </div>
                    )}
                </div>

                {/* Employees List View */}
                {empData.length === 0 ? (
                    <div className="text-center py-16 text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
                        <Users size={40} className="mx-auto mb-3 opacity-30 text-primary-600 dark:text-primary-400" />
                        <p className="font-bold">لا يوجد موظفون مطابقون للبحث والتصفية الحالية</p>
                        <p className="text-xs text-slate-400 mt-1">جرّب تغيير فلاتر التصفية في اللوحة المتقدمة</p>
                    </div>
                ) : viewMode === 'table' ? (
                    /* ── Table View ── */
                    <div className="bg-white/75 dark:bg-slate-900/75 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden animate-fade-in">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                                        {/* Sortable headers */}
                                        {visibleColumns.employee && (
                                        <th onClick={() => handleSort('name')} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span>الموظف</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        )}
                                        {visibleColumns.email && (
                                        <th onClick={() => handleSort('username')} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span>بريد المستخدم</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        )}
                                        {visibleColumns.details && (
                                        <th onClick={() => handleSort('department_id')} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span>القسم / الدرجة</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        )}
                                        {visibleColumns.hire_date && (
                                        <th onClick={() => handleSort('hire_date')} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span>تاريخ التعيين</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        )}
                                        {visibleColumns.status && (
                                        <th onClick={() => handleSort('is_active')} className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100/40 dark:hover:bg-slate-850/50 transition-colors">
                                            <div className="flex items-center gap-1.5">
                                                <span>الحالة</span>
                                                <ArrowUpDown size={12} className="opacity-60" />
                                            </div>
                                        </th>
                                        )}
                                        {visibleColumns.actions && (
                                        <th className="px-6 py-4 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-16 text-center">إجراء</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100/70 dark:divide-slate-800/60">
                                    {empData.map((emp) => (
                                        <tr key={emp.id} className="group border-r-4 border-r-transparent hover:border-r-primary-500 dark:hover:bg-primary-500/5 hover:bg-slate-50/40 transition-all duration-200">
                                            {visibleColumns.employee && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {/* Glowing Double Ring Avatar */}
                                                    <div className="relative p-1 rounded-full shrink-0">
                                                        <div className={`absolute inset-0 rounded-full blur-sm opacity-50 dark:opacity-40 animate-pulse ${
                                                            emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`} />
                                                        <div className={`relative p-0.5 rounded-full border-2 ${
                                                            emp.is_active 
                                                                ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                                                                : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                                                        }`}>
                                                            <img className="h-10 w-10 rounded-full object-cover transition-transform group-hover:scale-105"
                                                                src={emp.avatar} alt={emp.name} />
                                                        </div>
                                                        <div className={`absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                                                            emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                                        }`} />
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-800 dark:text-white text-sm group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{emp.name}</div>
                                                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 font-mono">@{emp.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            )}
                                            {visibleColumns.email && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2 text-sm text-slate-550 dark:text-slate-400 font-mono">
                                                    <Mail size={13} className="text-slate-350 dark:text-slate-600" />
                                                    <span className="text-xs">{emp.username}@school.com</span>
                                                </div>
                                            </td>
                                            )}
                                            {visibleColumns.details && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex flex-col gap-1.5">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 text-xs font-bold border border-primary-100 dark:border-primary-500/10 w-fit">
                                                        <Building size={11} /> {emp.department}
                                                    </span>
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-655 dark:text-slate-300 text-xs font-semibold border border-slate-200/60 dark:border-slate-800 w-fit">
                                                        <ShieldCheck size={11} /> {emp.jobGrade}
                                                    </span>
                                                </div>
                                            </td>
                                            )}
                                            {visibleColumns.hire_date && (
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400 font-bold font-sans">
                                                {emp.hire_date ?? '—'}
                                            </td>
                                            )}
                                            {visibleColumns.status && (
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {/* Premium Neon Switch Toggle */}
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); toggleStatus(emp); }}
                                                    className={`relative inline-flex items-center h-6 w-11 rounded-full p-0.5 transition-all duration-300 ${
                                                        emp.is_active 
                                                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]' 
                                                            : 'bg-slate-205 dark:bg-slate-800'
                                                    }`}
                                                    title={emp.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}>
                                                    <span 
                                                        className={`h-5 w-5 rounded-full bg-white shadow transition-all duration-305 transform ${
                                                            emp.is_active ? '-translate-x-5' : 'translate-x-0'
                                                        }`} 
                                                    />
                                                </button>
                                            </td>
                                            )}
                                            {visibleColumns.actions && (
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <ActionMenu emp={emp} />
                                            </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Pagination data={employees} />
                    </div>
                ) : (
                    /* ── Grid View ── */
                    <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                            {empData.map((emp) => (
                                <div key={emp.id} className="relative bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-slate-100 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1.5 transition-all duration-300 group bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:16px_16px]">
                                    <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                                        {/* Accent top border */}
                                        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500/20 via-primary-500 to-primary-700/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-350" />
                                        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-primary-500/5 to-transparent rounded-br-[100px]" />
                                    </div>
                                    
                                    <div className="relative z-10 flex justify-between items-start mb-5">
                                        {/* Glowing Double Ring Avatar */}
                                        <div className="relative p-1 rounded-full shrink-0">
                                            <div className={`absolute inset-0 rounded-full blur-sm opacity-50 dark:opacity-40 animate-pulse ${
                                                emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`} />
                                            <div className={`relative p-0.5 rounded-full border-2 ${
                                                emp.is_active 
                                                    ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20' 
                                                    : 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                                            }`}>
                                                <img className="h-16 w-16 rounded-2xl object-cover transition-transform group-hover:scale-105 duration-300"
                                                    src={emp.avatar} alt={emp.name} />
                                            </div>
                                            <div className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-900 ${
                                                emp.is_active ? 'bg-emerald-500' : 'bg-rose-500'
                                            }`} />
                                        </div>
                                        <ActionMenu emp={emp} />
                                    </div>
                                    
                                    <div className="relative z-10 mb-5">
                                        <h3 className="font-black text-slate-805 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">{emp.name}</h3>
                                        <p className="text-xs text-slate-400 dark:text-slate-500 font-mono mt-0.5">@{emp.username}</p>
                                    </div>

                                    <div className="relative z-10 space-y-2 mb-5">
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <Building size={14} className="text-slate-350 dark:text-slate-600" />
                                            <span className="font-semibold truncate">{emp.department}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <ShieldCheck size={14} className="text-slate-355 dark:text-slate-655" />
                                            <span className="font-semibold truncate">{emp.jobGrade}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-slate-450 dark:text-slate-500 font-sans font-bold">
                                            <Calendar size={14} className="text-slate-350 dark:text-slate-655" />
                                            <span>باشر في: {emp.hire_date ?? '—'}</span>
                                        </div>
                                    </div>

                                    <div className="relative z-10 flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                                        {/* Premium Switch Toggle */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleStatus(emp); }}
                                            className={`relative inline-flex items-center h-6 w-11 rounded-full p-0.5 transition-all duration-300 ${
                                                emp.is_active 
                                                    ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.45)]' 
                                                    : 'bg-slate-205 dark:bg-slate-800'
                                            }`}
                                            title={emp.is_active ? 'تعطيل الحساب' : 'تفعيل الحساب'}>
                                            <span 
                                                className={`h-5 w-5 rounded-full bg-white shadow transition-all duration-300 transform ${
                                                    emp.is_active ? '-translate-x-5' : 'translate-x-0'
                                                }`} 
                                            />
                                        </button>
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold">{emp.role}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="bg-white/70 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
                            <Pagination data={employees} />
                        </div>
                    </div>
                )}
            </div>

            {/* Print Official Template (hidden on screen, visible on Ctrl+P) */}
            <div className="hidden print:block text-right p-8 font-sans" dir="rtl">
                <div className="flex justify-between items-center border-b-2 border-primary-600 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-primary-700">مدارس القيم الأهلية</h1>
                        <p className="text-xs text-slate-500 font-bold mt-1">تقرير كشف الموظفين الإداريين الرسمي</p>
                    </div>
                    <div className="text-left">
                        <p className="text-xs text-slate-500 font-bold">التاريخ: {new Date().toLocaleDateString('ar-EG')}</p>
                        <p className="text-xs text-slate-500 font-bold">الجهة المصدرة: إدارة الموارد البشرية</p>
                    </div>
                </div>
                
                <table className="w-full text-right border-collapse border border-slate-300 text-xs">
                    <thead>
                        <tr className="bg-slate-100">
                            <th className="border border-slate-300 p-2 font-bold">الموظف</th>
                            <th className="border border-slate-300 p-2 font-bold">اسم المستخدم</th>
                            <th className="border border-slate-300 p-2 font-bold">القسم</th>
                            <th className="border border-slate-300 p-2 font-bold">الدرجة الوظيفية</th>
                            <th className="border border-slate-300 p-2 font-bold">تاريخ التعيين</th>
                            <th className="border border-slate-300 p-2 font-bold">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        {empData.map(emp => (
                            <tr key={emp.id}>
                                <td className="border border-slate-300 p-2 font-bold">{emp.name}</td>
                                <td className="border border-slate-300 p-2 font-mono">{emp.username}</td>
                                <td className="border border-slate-300 p-2">{emp.department}</td>
                                <td className="border border-slate-300 p-2">{emp.jobGrade}</td>
                                <td className="border border-slate-300 p-2 font-sans">{emp.hire_date ?? '—'}</td>
                                <td className="border border-slate-300 p-2 font-bold">{emp.is_active ? 'نشط' : 'معطل'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </AdminLayout>
    );
}
