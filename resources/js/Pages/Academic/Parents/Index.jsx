import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Users, Search, Plus, Edit, Trash2, Mail, Phone, MapPin, UserCheck, Shield,
    LayoutGrid, List, Printer, KeyRound, Filter, RotateCcw, GraduationCap,
    UserX, PhoneOff, ArrowUpDown, SlidersHorizontal, CheckCircle2
} from 'lucide-react';
import Swal from 'sweetalert2';
import ResetPasswordModal from './Components/ResetPasswordModal';
import CredentialsPrintModal from './Components/CredentialsPrintModal';

export default function ParentsIndex({ parents, sections = [], filters = {}, stats = {} }) {
    const { appLogo, flash } = usePage().props;
    const logoUrl = appLogo || '/images/logo.png';
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search || '');
    const [selectedSection, setSelectedSection] = useState(filters.section_id ? String(filters.section_id) : '');
    const [selectedGrade, setSelectedGrade] = useState(filters.grade_id ? String(filters.grade_id) : '');
    const [selectedDivision, setSelectedDivision] = useState(filters.division_id ? String(filters.division_id) : '');
    const [childrenFilter, setChildrenFilter] = useState(filters.children_filter || '');
    const [relationshipType, setRelationshipType] = useState(filters.relationship_type || '');
    const [accountStatus, setAccountStatus] = useState(filters.account_status || '');
    const [phoneStatus, setPhoneStatus] = useState(filters.phone_status || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'latest');
    const [perPage, setPerPage] = useState(filters.per_page || 12);
    const [showFilters, setShowFilters] = useState(true);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [resetPasswordParent, setResetPasswordParent] = useState(null);
    const [printCredentialsData, setPrintCredentialsData] = useState(null);
    const [isQuickResetting, setIsQuickResetting] = useState(false);
    const lastFlashKeyRef = useRef(null);
    const isFirstRender = useRef(true);

    const availableGrades = useMemo(() => {
        if (selectedSection) {
            const sec = sections.find(s => String(s.id) === String(selectedSection));
            return sec?.grades || [];
        }
        return sections.flatMap(s => s.grades || []);
    }, [sections, selectedSection]);

    const availableDivisions = useMemo(() => {
        if (!selectedGrade) return [];
        const grade = availableGrades.find(g => String(g.id) === String(selectedGrade));
        return grade?.divisions || [];
    }, [availableGrades, selectedGrade]);

    useEffect(() => {
        if (flash?.generated_credentials) {
            const creds = flash.generated_credentials;
            const flashKey = creds.issued_at || JSON.stringify(creds);
            if (lastFlashKeyRef.current !== flashKey) {
                lastFlashKeyRef.current = flashKey;
                setPrintCredentialsData(creds);
            }
        } else if (flash?.success && flash.success.includes('أولياء الأمور بنجاح')) {
            Swal.fire({
                title: 'تمت العملية بنجاح!',
                text: flash.success,
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'طباعة بطاقات الدخول PDF الآن',
                cancelButtonText: 'إغلاق',
                confirmButtonColor: '#be123c'
            }).then((result) => {
                if (result.isConfirmed) {
                    handleDownloadCredentialsPdf();
                }
            });
        }
    }, [flash?.generated_credentials, flash?.success]);

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
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedSection) params.section_id = selectedSection;
        if (selectedGrade) params.grade_id = selectedGrade;
        if (selectedDivision) params.division_id = selectedDivision;
        if (childrenFilter) params.children_filter = childrenFilter;
        if (relationshipType) params.relationship_type = relationshipType;
        if (accountStatus) params.account_status = accountStatus;
        if (phoneStatus) params.phone_status = phoneStatus;
        if (sortBy && sortBy !== 'latest') params.sort_by = sortBy;
        if (perPage && Number(perPage) !== 12) params.per_page = perPage;

        router.get(route('academic.parents'), params, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    }, [debouncedSearch, selectedSection, selectedGrade, selectedDivision, childrenFilter, relationshipType, accountStatus, phoneStatus, sortBy, perPage]);

    const handleResetFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setSelectedSection('');
        setSelectedGrade('');
        setSelectedDivision('');
        setChildrenFilter('');
        setRelationshipType('');
        setAccountStatus('');
        setPhoneStatus('');
        setSortBy('latest');
        setPerPage(12);
    };

    const handleDownloadCredentialsPdf = () => {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedSection) params.section_id = selectedSection;
        if (selectedGrade) params.grade_id = selectedGrade;
        if (selectedDivision) params.division_id = selectedDivision;
        if (childrenFilter) params.children_filter = childrenFilter;
        if (relationshipType) params.relationship_type = relationshipType;
        if (accountStatus) params.account_status = accountStatus;
        if (phoneStatus) params.phone_status = phoneStatus;
        if (sortBy && sortBy !== 'latest') params.sort_by = sortBy;

        const queryString = new URLSearchParams(params).toString();
        const url = route('academic.parents.credentials-pdf') + (queryString ? '?' + queryString : '');
        window.open(url, '_blank');
    };

    const handleBulkResetPassword = () => {
        const totalFiltered = parents?.total || 0;
        Swal.fire({
            title: 'إعادة تعيين كلمات المرور جماعياً',
            html: `
                <div dir="rtl" class="text-right space-y-4 mt-2">
                    <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold leading-relaxed">
                        سيتم توليد وحفظ كلمات مرور جديدة لأولياء الأمور المطابقين للفلتر الحالي (إجمالي النتائج الحالية: <strong>${totalFiltered}</strong>) لتكون جاهزة للطباعة في ملف PDF.
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">نطاق الحسابات المستهدفة</label>
                        <select id="swal-target-scope" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500">
                            <option value="all_filtered">جميع أولياء الأمور في الفلتر الحالي (${totalFiltered})</option>
                            <option value="missing_only">فقط الحسابات التي ليس لها كلمة مرور محفوظة للطباعة</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">نمط توليد كلمة المرور</label>
                        <select id="swal-password-mode" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500" onchange="document.getElementById('swal-manual-wrap').style.display = this.value === 'manual' ? 'block' : 'none';">
                            <option value="digits_6">تلقائي — 6 أرقام عشوائية لكل ولي أمر (مثال: 347559)</option>
                            <option value="alnum_8">تلقائي — 8 خانات حروف وأرقام لكل ولي أمر</option>
                            <option value="manual">كلمة مرور موحّدة يدوية للجميع</option>
                        </select>
                    </div>
                    <div id="swal-manual-wrap" style="display:none;">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الموحّدة</label>
                        <input id="swal-manual-password" type="text" placeholder="أدخل كلمة المرور الموحدة (4 خانات فأكثر)" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500" />
                    </div>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d97706',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'تنفيذ إعادة التعيين',
            cancelButtonText: 'إلغاء',
            preConfirm: () => {
                const target_scope = document.getElementById('swal-target-scope')?.value || 'all_filtered';
                const password_mode = document.getElementById('swal-password-mode')?.value || 'digits_6';
                const manual_password = document.getElementById('swal-manual-password')?.value || '';
                if (password_mode === 'manual' && manual_password.trim().length < 4) {
                    Swal.showValidationMessage('يرجى إدخال كلمة مرور موحدة لا تقل عن 4 خانات');
                    return false;
                }
                return { target_scope, password_mode, manual_password: manual_password.trim() };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const payload = { ...result.value };
                if (debouncedSearch) payload.search = debouncedSearch;
                if (selectedSection) payload.section_id = selectedSection;
                if (selectedGrade) payload.grade_id = selectedGrade;
                if (selectedDivision) payload.division_id = selectedDivision;
                if (childrenFilter) payload.children_filter = childrenFilter;
                if (relationshipType) payload.relationship_type = relationshipType;
                if (accountStatus) payload.account_status = accountStatus;
                if (phoneStatus) payload.phone_status = phoneStatus;

                router.post(route('academic.parents.bulk-reset-password'), payload, {
                    preserveScroll: true,
                });
            }
        });
    };

    const buildParentModalTarget = (parent) => {
        const children = parent.children || [];
        const childrenSummary = children.map((child) => {
            const childName = child.user?.name || 'طالب';
            const enroll = child.current_enrollment || child.currentEnrollment;
            const gradeName = enroll?.division?.grade?.name;
            const divisionName = enroll?.division?.name;
            if (gradeName && divisionName) {
                return `${childName} (${gradeName} - ${divisionName})`;
            }
            if (gradeName) {
                return `${childName} (${gradeName})`;
            }
            return childName;
        }).join(' ، ');

        return {
            id: parent.id,
            name: parent.name || 'ولي أمر',
            username: parent.username || parent.national_id || '',
            phone: parent.phone || '',
            login_password: parent.login_password || null,
            is_active: Boolean(parent.is_active ?? true),
            must_change_password: Boolean(parent.must_change_password ?? false),
            children_summary: childrenSummary,
            children_count: children.length,
        };
    };

    const openPrintForParent = (parent) => {
        const target = buildParentModalTarget(parent);
        setPrintCredentialsData({
            action: 'view',
            parent_id: target.id,
            name: target.name,
            username: target.username,
            password: target.login_password,
            phone: target.phone,
            children_summary: target.children_summary,
            children_count: target.children_count,
            must_change_password: target.must_change_password,
            revoked_tokens: false,
        });
    };

    const openResetForParent = (parent) => {
        setResetPasswordParent(buildParentModalTarget(parent));
    };

    const handleQuickResetFromPrint = (parentId) => {
        if (!parentId) return;
        router.post(
            route('academic.parents.reset-password', parentId),
            {
                mode: 'auto',
                style: 'digits',
                must_change_password: false,
                revoke_tokens: false,
                open_print_modal: true,
            },
            {
                preserveScroll: true,
                onStart: () => setIsQuickResetting(true),
                onFinish: () => setIsQuickResetting(false),
            }
        );
    };

    const handleOpenResetFromPrint = (parentId) => {
        const matched = (parents?.data || []).find((p) => p.id === parentId);
        if (matched) {
            setPrintCredentialsData(null);
            openResetForParent(matched);
        } else if (printCredentialsData) {
            const fallback = {
                id: printCredentialsData.parent_id,
                name: printCredentialsData.name,
                username: printCredentialsData.username,
                phone: printCredentialsData.phone || '',
                is_active: true,
                must_change_password: Boolean(printCredentialsData.must_change_password),
                children_summary: printCredentialsData.children_summary || '',
                children_count: printCredentialsData.children_count || 0,
            };
            setPrintCredentialsData(null);
            setResetPasswordParent(fallback);
        }
    };

    const handleDownloadSingleParentPdf = (parentId) => {
        if (!parentId) return;
        const url = route('academic.parents.credentials-pdf') + '?parent_ids=' + encodeURIComponent(parentId);
        window.open(url, '_blank');
    };

    const activeFiltersCount = [
        debouncedSearch,
        selectedSection,
        selectedGrade,
        selectedDivision,
        childrenFilter,
        relationshipType,
        accountStatus,
        phoneStatus,
        sortBy !== 'latest' ? sortBy : '',
        Number(perPage) !== 12 ? String(perPage) : '',
    ].filter(Boolean).length;

    const formatChildBadge = (child) => {
        const firstName = child.user?.name?.split(' ')[0] || 'طالب';
        const relation = child.pivot?.relationship_type || 'ابن';
        const enrollment = child.current_enrollment || child.currentEnrollment;
        const gradeName = enrollment?.division?.grade?.name;
        const divisionName = enrollment?.division?.name;

        if (gradeName && divisionName) {
            return `${firstName} (${relation} • ${gradeName} / ${divisionName})`;
        }
        if (gradeName) {
            return `${firstName} (${relation} • ${gradeName})`;
        }
        return `${firstName} (${relation})`;
    };

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

                            <div className="relative flex-1 md:w-72 group">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    placeholder="بحث بالاسم، المستخدم، الهوية، الجوال، أو اسم الابن..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-xl px-10 py-2.5 text-sm outline-none transition-all dark:text-white"
                                />
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowFilters((prev) => !prev)}
                                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border transition-all shrink-0 ${
                                    showFilters || activeFiltersCount > 0
                                        ? 'bg-primary-50 text-primary-700 border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/30'
                                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                <SlidersHorizontal size={17} />
                                <span className="hidden sm:inline">الفلاتر</span>
                                {activeFiltersCount > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-black rounded-full bg-primary-600 text-white">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleBulkResetPassword}
                                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 shrink-0 active:scale-95"
                                title="إعادة تعيين كلمات المرور لجميع أولياء الأمور الظاهرين في الفلتر الحالي"
                            >
                                <KeyRound size={17} />
                                <span className="hidden sm:inline">إعادة تعيين كلمات المرور</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleDownloadCredentialsPdf}
                                className="flex items-center justify-center gap-2 bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all hover:-translate-y-0.5 shrink-0 active:scale-95"
                                title="طباعة بيانات الدخول (اسم المستخدم وكلمة المرور) لجميع أولياء الأمور الظاهرين في الفلتر الحالي بصيغة PDF"
                            >
                                <Printer size={17} />
                                <span className="hidden sm:inline">بيانات الدخول PDF</span>
                            </button>
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

                {/* Quick Summary & Filter Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <button
                        type="button"
                        onClick={handleResetFilters}
                        className={`text-right p-4 rounded-2xl border transition-all ${
                            activeFiltersCount === 0
                                ? 'bg-primary-50/80 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/40 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-primary-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي أولياء الأمور</span>
                            <Users size={18} className="text-primary-600 dark:text-primary-400" />
                        </div>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{stats.total ?? parents.total ?? 0}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setAccountStatus((prev) => (prev === 'active' ? '' : 'active'))}
                        className={`text-right p-4 rounded-2xl border transition-all ${
                            accountStatus === 'active'
                                ? 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/40 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">حسابات نشطة</span>
                            <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">{stats.active ?? 0}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChildrenFilter((prev) => (prev === 'has_children' ? '' : 'has_children'))}
                        className={`text-right p-4 rounded-2xl border transition-all ${
                            childrenFilter === 'has_children'
                                ? 'bg-sky-50/90 dark:bg-sky-500/15 border-sky-400 dark:border-sky-500/40 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-sky-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">مرتبطون بأبناء</span>
                            <GraduationCap size={18} className="text-sky-600 dark:text-sky-400" />
                        </div>
                        <p className="text-2xl font-black text-sky-700 dark:text-sky-400">{stats.has_children ?? 0}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setChildrenFilter((prev) => (prev === 'no_children' ? '' : 'no_children'))}
                        className={`text-right p-4 rounded-2xl border transition-all ${
                            childrenFilter === 'no_children'
                                ? 'bg-amber-50/90 dark:bg-amber-500/15 border-amber-400 dark:border-amber-500/40 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-amber-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">بدون أبناء مرتبطين</span>
                            <UserX size={18} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <p className="text-2xl font-black text-amber-700 dark:text-amber-400">{stats.no_children ?? 0}</p>
                    </button>

                    <button
                        type="button"
                        onClick={() => setPhoneStatus((prev) => (prev === 'without_phone' ? '' : 'without_phone'))}
                        className={`text-right p-4 rounded-2xl border transition-all ${
                            phoneStatus === 'without_phone'
                                ? 'bg-rose-50/90 dark:bg-rose-500/15 border-rose-400 dark:border-rose-500/40 shadow-sm'
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-rose-200'
                        }`}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">بدون رقم جوال</span>
                            <PhoneOff size={18} className="text-rose-600 dark:text-rose-400" />
                        </div>
                        <p className="text-2xl font-black text-rose-700 dark:text-rose-400">{stats.without_phone ?? 0}</p>
                    </button>
                </div>

                {/* Comprehensive Filter Panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-5 shadow-sm space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700/70">
                            <div className="flex items-center gap-2 text-slate-800 dark:text-white font-bold text-sm">
                                <Filter size={17} className="text-primary-600" />
                                <span>تصفية أولياء الأمور</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                                <span>النتائج المطابقة: <strong className="text-primary-600 dark:text-primary-400">{parents.total || 0}</strong></span>
                                {activeFiltersCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={handleResetFilters}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 transition-colors"
                                    >
                                        <RotateCcw size={14} />
                                        <span>إعادة ضبط الفلاتر</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">القسم / المرحلة</label>
                                <select
                                    value={selectedSection}
                                    onChange={(e) => {
                                        setSelectedSection(e.target.value);
                                        setSelectedGrade('');
                                        setSelectedDivision('');
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">كل الأقسام</option>
                                    {sections.map((sec) => (
                                        <option key={sec.id} value={sec.id}>{sec.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الصف الدراسي</label>
                                <select
                                    value={selectedGrade}
                                    onChange={(e) => {
                                        setSelectedGrade(e.target.value);
                                        setSelectedDivision('');
                                    }}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">كل الصفوف</option>
                                    {availableGrades.map((grade) => (
                                        <option key={grade.id} value={grade.id}>{grade.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">الشعبة</label>
                                <select
                                    value={selectedDivision}
                                    onChange={(e) => setSelectedDivision(e.target.value)}
                                    disabled={!selectedGrade}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500 disabled:opacity-50"
                                >
                                    <option value="">كل الشعب</option>
                                    {availableDivisions.map((div) => (
                                        <option key={div.id} value={div.id}>{div.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">ارتباط الأبناء</label>
                                <select
                                    value={childrenFilter}
                                    onChange={(e) => setChildrenFilter(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">الكل</option>
                                    <option value="has_children">لديه أبناء مسجلون</option>
                                    <option value="no_children">بدون أبناء مرتبطين</option>
                                    <option value="multiple_children">أكثر من ابن / إخوة (2+)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">صلة القرابة</label>
                                <select
                                    value={relationshipType}
                                    onChange={(e) => setRelationshipType(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">الكل</option>
                                    <option value="أب">أب</option>
                                    <option value="أم">أم</option>
                                    <option value="أخ">أخ</option>
                                    <option value="أخرى">أخرى</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">حالة الحساب</label>
                                <select
                                    value={accountStatus}
                                    onChange={(e) => setAccountStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">الكل</option>
                                    <option value="active">حساب نشط</option>
                                    <option value="inactive">حساب معطل</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">توفر رقم الجوال</label>
                                <select
                                    value={phoneStatus}
                                    onChange={(e) => setPhoneStatus(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="">الكل</option>
                                    <option value="with_phone">مسجل رقم جوال</option>
                                    <option value="without_phone">بدون رقم جوال</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1">
                                    <ArrowUpDown size={12} />
                                    <span>الترتيب</span>
                                </label>
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value="latest">الأحدث إضافةً</option>
                                    <option value="name_asc">الاسم أبجدياً</option>
                                    <option value="children_desc">الأكثر أبناءً</option>
                                    <option value="oldest">الأقدم إضافةً</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5">عدد العناصر بالصفحة</label>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    <option value={12}>12</option>
                                    <option value={24}>24</option>
                                    <option value={48}>48</option>
                                    <option value={100}>100</option>
                                </select>
                            </div>
                        </div>

                        {activeFiltersCount > 0 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-700/70">
                                <div className="flex flex-wrap items-center gap-2 text-xs">
                                    <span className="font-bold text-slate-500 dark:text-slate-400">الفلاتر النشطة ({activeFiltersCount}):</span>
                                    {debouncedSearch && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200 dark:bg-primary-500/10 dark:text-primary-300 dark:border-primary-500/20 font-semibold">
                                            بحث: {debouncedSearch}
                                            <button type="button" onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {selectedSection && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold">
                                            القسم: {sections.find(s => String(s.id) === String(selectedSection))?.name || selectedSection}
                                            <button type="button" onClick={() => { setSelectedSection(''); setSelectedGrade(''); setSelectedDivision(''); }} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {selectedGrade && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold">
                                            الصف: {availableGrades.find(g => String(g.id) === String(selectedGrade))?.name || selectedGrade}
                                            <button type="button" onClick={() => { setSelectedGrade(''); setSelectedDivision(''); }} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {selectedDivision && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200 font-semibold">
                                            الشعبة: {availableDivisions.find(d => String(d.id) === String(selectedDivision))?.name || selectedDivision}
                                            <button type="button" onClick={() => setSelectedDivision('')} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {childrenFilter && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20 font-semibold">
                                            الأبناء: {childrenFilter === 'has_children' ? 'لديه أبناء' : childrenFilter === 'no_children' ? 'بدون أبناء' : 'أكثر من ابن'}
                                            <button type="button" onClick={() => setChildrenFilter('')} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {relationshipType && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 font-semibold">
                                            القرابة: {relationshipType}
                                            <button type="button" onClick={() => setRelationshipType('')} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {accountStatus && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20 font-semibold">
                                            الحساب: {accountStatus === 'active' ? 'نشط' : 'معطل'}
                                            <button type="button" onClick={() => setAccountStatus('')} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                    {phoneStatus && (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 font-semibold">
                                            الجوال: {phoneStatus === 'with_phone' ? 'متوفر' : 'غير مسجل'}
                                            <button type="button" onClick={() => setPhoneStatus('')} className="hover:text-rose-600">×</button>
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    <span>إعادة ضبط الفلاتر</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

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
                                            <button onClick={() => openPrintForParent(parent)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                                <Printer size={16} />
                                            </button>
                                            <button onClick={() => openResetForParent(parent)} className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
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
                                                        {formatChildBadge(child)}
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
                                                            parent.children.map((child) => (
                                                                <span key={child.id} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-lg font-medium border border-slate-200 dark:border-slate-600">
                                                                    {formatChildBadge(child)}
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
                                                        <button onClick={() => openPrintForParent(parent)} className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors tooltip" title="طباعة بيانات الدخول">
                                                            <Printer size={16} />
                                                        </button>
                                                        <button onClick={() => openResetForParent(parent)} className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors tooltip" title="إعادة تعيين كلمة المرور">
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
                {parents?.links && parents.links.length > 3 && (
                    <div className="flex justify-center mt-8">
                        <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-800/50 p-2 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                            {parents.links.map((link, index) => {
                                if (!link.url) {
                                    return (
                                        <span
                                            key={index}
                                            className="px-4 py-2 rounded-xl text-sm font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        preserveScroll
                                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                                            link.active 
                                                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30' 
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <ResetPasswordModal
                isOpen={!!resetPasswordParent}
                parent={resetPasswordParent}
                onClose={() => setResetPasswordParent(null)}
            />

            <CredentialsPrintModal
                isOpen={!!printCredentialsData}
                credentials={printCredentialsData}
                logoUrl={logoUrl}
                isQuickResetting={isQuickResetting}
                onClose={() => setPrintCredentialsData(null)}
                onOpenResetPassword={handleOpenResetFromPrint}
                onQuickResetPassword={handleQuickResetFromPrint}
                onDownloadSinglePdf={handleDownloadSingleParentPdf}
            />
        </AdminLayout>
    );
}
