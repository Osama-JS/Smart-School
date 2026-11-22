import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Users, Search, Plus, Edit, Trash2, Mail, Phone, GraduationCap, Building2, BookOpen, 
    ShieldAlert, Printer, RotateCcw, Upload, LayoutGrid, List, KeyRound, Filter, 
    SlidersHorizontal, X, CheckCircle2, AlertCircle, Ban, Bus, Stethoscope, RefreshCw,
    FileSpreadsheet, Download, CheckSquare, Square
} from 'lucide-react';
import axios from 'axios';
import Swal from 'sweetalert2';
import ExcelJS from 'exceljs';
import SelectInput from '@/Components/SelectInput';
import ImportModal from './Components/ImportModal';
import ResetPasswordModal from './Components/ResetPasswordModal';
import CredentialsPrintModal from './Components/CredentialsPrintModal';

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
        const pwdDisplay = cred?.password ? cred.password : '<span style="color:#94a3b8; letter-spacing:4px; font-size:18px;">••••••••</span>';
        const pwdNote = cred?.password 
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
                        <h2 class="employee-name">${cred?.name || 'طالب'}</h2>
                    </div>

                    <div class="credentials-grid">
                        <div class="cred-box">
                            <div class="cred-label">
                                <svg class="cred-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                اسم المستخدم:
                            </div>
                            <div class="cred-value">${cred?.username || '-'}</div>
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

// ─── Helper: Search Highlighting ─────────────────────────────────────────────
const highlightText = (text, query) => {
    if (!query || !text) return text;
    const str = String(text);
    const trimmed = query.trim();
    if (!trimmed) return text;
    const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = str.split(regex);
    return parts.map((part, i) => 
        regex.test(part) ? (
            <mark key={i} className="bg-amber-200 dark:bg-amber-400/30 text-amber-900 dark:text-amber-200 px-1 py-0.5 rounded font-black">
                {part}
            </mark>
        ) : (
            part
        )
    );
};

export default function StudentsIndex({ 
    students = { data: [], total: 0, links: [] }, 
    academicYears = [], 
    sections = [],
    filters = {},
    statusCounts = { all: 0, active: 0, unregistered: 0, transferred: 0, blocked: 0 }
}) {
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters?.search || '');
    const [showImportModal, setShowImportModal] = useState(false);
    const [showAdvancedModal, setShowAdvancedModal] = useState(false);
    const [viewMode, setViewMode] = useState('table');
    const isFirstMount = useRef(true);
    
    // Filters State
    const [selectedYear, setSelectedYear] = useState(filters?.academic_year_id || '');
    const [selectedSection, setSelectedSection] = useState(filters?.section_id || '');
    const [selectedGrade, setSelectedGrade] = useState(filters?.grade_id || '');
    const [selectedDivision, setSelectedDivision] = useState(filters?.division_id || '');
    const [statusTab, setStatusTab] = useState(filters?.status_tab || 'all');
    const [transportFilter, setTransportFilter] = useState(filters?.transport || '');
    const [accountStatusFilter, setAccountStatusFilter] = useState(filters?.account_status || '');
    const [medicalFilter, setMedicalFilter] = useState(filters?.medical || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 15);
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [isPrintingBatch, setIsPrintingBatch] = useState(false);
    const [resetPasswordStudent, setResetPasswordStudent] = useState(null);
    const [printCredentialsData, setPrintCredentialsData] = useState(null);
    const [isQuickResetting, setIsQuickResetting] = useState(false);
    const lastFlashKeyRef = useRef(null);

    const { flash, appSettings, logo_url } = usePage().props;
    const logoUrl = logo_url || appSettings?.logo_url || '';

    // 1. الفلترة الهرمية التتابعية: حساب الصفوف والشعب المتاحة
    const selectedSectionObj = (sections || []).find(s => String(s.id) === String(selectedSection));
    const availableGrades = selectedSectionObj?.grades || [];
    
    const selectedGradeObj = (availableGrades || []).find(g => String(g.id) === String(selectedGrade));
    const availableDivisions = selectedGradeObj?.divisions || [];

    const handleSectionChange = (val) => {
        setSelectedSection(val);
        setSelectedGrade('');
        setSelectedDivision('');
    };

    const handleGradeChange = (val) => {
        setSelectedGrade(val);
        setSelectedDivision('');
    };

    const handleClearAllFilters = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setSelectedYear('');
        setSelectedSection('');
        setSelectedGrade('');
        setSelectedDivision('');
        setStatusTab('all');
        setTransportFilter('');
        setAccountStatusFilter('');
        setMedicalFilter('');
        setPerPage(15);
    };

    // ─── تصدير إكسيل مطابق لدليل الموظفين (ExcelJS Export) ─────────────────────────
    const [isExporting, setIsExporting] = useState(false);

    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            // 1. جلب بيانات الطلاب المطابقين للفلاتر الحالية
            const params = { format: 'json' };
            if (debouncedSearch) params.search = debouncedSearch;
            if (selectedYear) params.academic_year_id = selectedYear;
            if (selectedSection) params.section_id = selectedSection;
            if (selectedGrade) params.grade_id = selectedGrade;
            if (selectedDivision) params.division_id = selectedDivision;
            if (statusTab && statusTab !== 'all') params.status_tab = statusTab;
            if (transportFilter) params.transport = transportFilter;
            if (accountStatusFilter) params.account_status = accountStatusFilter;
            if (medicalFilter) params.medical = medicalFilter;

            let studentsList = [];
            try {
                const res = await axios.get(route('academic.students.export'), { params });
                if (res.data?.students) {
                    studentsList = res.data.students;
                }
            } catch (err) {
                console.warn('Export endpoint fetch failed, falling back to page data:', err);
                studentsList = (students?.data || []).map(student => {
                    const enroll = student.currentEnrollment;
                    const parent = student.parents?.[0];

                    let statusLabel = 'غير مسجل';
                    let statusKey = 'unregistered';
                    if (enroll) {
                        if (enroll.is_result_blocked) {
                            statusLabel = 'محجوب النتيجة';
                            statusKey = 'blocked';
                        } else if (enroll.status === 'active') {
                            statusLabel = 'نشط';
                            statusKey = 'active';
                        } else if (enroll.status === 'transferred') {
                            statusLabel = 'منقول';
                            statusKey = 'transferred';
                        } else {
                            statusLabel = 'مسحوب/خريج';
                            statusKey = 'transferred';
                        }
                    }

                    return {
                        id: student.id,
                        code: student.user?.username || String(student.id),
                        name: student.user?.name || 'غير محدد',
                        national_id: student.user?.national_id || '-',
                        phone: student.user?.phone || '-',
                        section: enroll?.division?.grade?.section?.name || '-',
                        grade: enroll?.division?.grade?.name || '-',
                        division: enroll?.division?.name || '-',
                        status: statusLabel,
                        status_key: statusKey,
                        parent_name: parent?.name || '-',
                        parent_phone: parent?.phone || '-',
                    };
                });
            }

            if (!studentsList || studentsList.length === 0) {
                Swal.fire({
                    title: 'لا توجد بيانات',
                    text: 'لا توجد سجلات طلاب لتصديرها وفق الفلتر المحدد.',
                    icon: 'info',
                    confirmButtonText: 'حسناً',
                    confirmButtonColor: '#6b9b37'
                });
                return;
            }

            // 2. بناء ملف Excel منسق واحترافي عبر ExcelJS
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('سجل الطلاب', {
                views: [{ rightToLeft: true, state: 'frozen', ySplit: 9 }],
                pageSetup: {
                    paperSize: 9, // A4
                    orientation: 'landscape',
                    fitToPage: true,
                    fitToWidth: 1,
                    fitToHeight: 0,
                    margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
                },
                headerFooter: {
                    oddFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - النظام الأكاديمي',
                    evenFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - النظام الأكاديمي'
                }
            });

            // 3. استخراج وإدراج الشعار
            let logoId = null;
            const logoPath = logo_url || appSettings?.logo_url || '/images/logo.png';
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

            // تعيين عروض الأعمدة الـ 11
            sheet.columns = [
                { width: 8 },  // #
                { width: 16 }, // كود الطالب
                { width: 34 }, // اسم الطالب
                { width: 18 }, // رقم الهوية
                { width: 16 }, // رقم الهاتف
                { width: 20 }, // المرحلة / القسم
                { width: 20 }, // الصف
                { width: 14 }, // الشعبة
                { width: 16 }, // حالة القيد
                { width: 24 }, // ولي الأمر
                { width: 18 }  // هاتف ولي الأمر
            ];

            // الصف 1: شريط ترويسة أخضر رمزي
            sheet.getRow(1).height = 10;
            sheet.mergeCells('A1:K1');
            sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

            sheet.getRow(2).height = 35;
            sheet.getRow(3).height = 25;
            sheet.getRow(4).height = 20;

            if (logoId !== null) {
                sheet.addImage(logoId, { tl: { col: 5.2, row: 1.1 }, ext: { width: 85, height: 85 } });
            }

            // ترويسة المدرسة الرسمية (يمين)
            sheet.mergeCells('A2:D2');
            const titleCell = sheet.getCell('A2');
            titleCell.value = 'مدارس القيم الأهلية';
            titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF6B9B37' } }; 
            titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells('A3:D3');
            const enTitleCell = sheet.getCell('A3');
            enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
            enTitleCell.font = { name: 'Segoe UI', size: 18, bold: true, color: { argb: 'FF6B9B37' } }; 
            enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells('A4:D4');
            const subTitleCell = sheet.getCell('A4');
            subTitleCell.value = 'النظام الأكاديمي - سجل الطلاب';
            subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } }; 
            subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            // ميتاداتا التقرير والاعتماد (يسار)
            sheet.mergeCells('H2:K2');
            const meta1Cell = sheet.getCell('H2');
            meta1Cell.value = 'نوع التقرير: كشف الطلاب المفلتر';
            meta1Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            meta1Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            const exportDate = new Date().toLocaleString('ar-EG');
            sheet.mergeCells('H3:K3');
            const meta2Cell = sheet.getCell('H3');
            meta2Cell.value = `تاريخ التصدير: ${exportDate}`;
            meta2Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            meta2Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.mergeCells('H4:K4');
            const meta3Cell = sheet.getCell('H4');
            meta3Cell.value = 'حالة التقرير: معتمد ✔';
            meta3Cell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
            meta3Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.getRow(5).height = 12;

            // الصف 7: بطاقة الإحصائيات المدمجة
            sheet.getRow(7).height = 30;
            sheet.mergeCells('A7:K7');
            const statsCell = sheet.getCell('A7');
            const totalCount = studentsList.length;
            const activeCount = studentsList.filter(s => s.status_key === 'active' || s.status === 'نشط').length;
            const unregCount = studentsList.filter(s => s.status_key === 'unregistered' || s.status === 'غير مسجل').length;
            const transCount = studentsList.filter(s => s.status_key === 'transferred' || s.status === 'منقول' || s.status === 'مسحوب/خريج').length;
            const blockedCount = studentsList.filter(s => s.status_key === 'blocked' || s.status === 'محجوب النتيجة').length;

            statsCell.value = `📊 إجمالي النتائج: ${totalCount} طالب   |   ✅ النشطون: ${activeCount}   |   ⚠️ غير مسجلين: ${unregCount}   |   🔄 منقولون/مسحوبون: ${transCount}   |   🚫 محجوبو النتيجة: ${blockedCount}`;
            statsCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
            statsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } };
            statsCell.border = { 
                top: { style: 'medium', color: { argb: 'FF96CF75' } }, 
                bottom: { style: 'medium', color: { argb: 'FF96CF75' } }, 
                left: { style: 'medium', color: { argb: 'FF96CF75' } }, 
                right: { style: 'medium', color: { argb: 'FF96CF75' } } 
            };

            sheet.getRow(8).height = 10;

            // الصف 9: ترويسة الجدول الرئيسية
            const headers = [
                "#",
                "كود الطالب",
                "اسم الطالب",
                "رقم الهوية",
                "رقم الهاتف",
                "المرحلة / القسم",
                "الصف الدراسي",
                "الشعبة",
                "حالة القيد",
                "ولي الأمر",
                "هاتف ولي الأمر"
            ];
            const headerRow = sheet.addRow(headers);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
                cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { 
                    top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, 
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, 
                    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, 
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } } 
                };
            });

            // صفوف البيانات
            studentsList.forEach((st, index) => {
                const row = sheet.addRow([
                    index + 1,
                    st.code || '-',
                    st.name || '-',
                    st.national_id || '-',
                    st.phone || '-',
                    st.section || '-',
                    st.grade || '-',
                    st.division || '-',
                    st.status || 'غير مسجل',
                    st.parent_name || '-',
                    st.parent_phone || '-'
                ]);

                row.height = 32;
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                    cell.border = { 
                        bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, 
                        left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, 
                        right: { style: 'thin', color: { argb: 'FFDEE2E6' } } 
                    };
                    
                    // محاذاة الأسماء لليمين
                    if (colNumber === 3 || colNumber === 10) {
                        cell.alignment = { horizontal: 'right', vertical: 'middle', wrapText: true };
                        if (colNumber === 3) {
                            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF0F172A' } };
                        }
                    }

                    // تنسيق نصي للأرقام (الهوية، الهاتف، الكود)
                    if ([2, 4, 5, 11].includes(colNumber)) {
                        cell.numFmt = '@';
                        cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
                    }

                    // رقم المسلسل
                    if (colNumber === 1) {
                        cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF64748B' } };
                    }
                });

                // تلوين تبادلي للصفوف
                if (index % 2 === 0) {
                    row.eachCell((cell, colNumber) => {
                        if (colNumber !== 9) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FCF7' } };
                        }
                    });
                }

                // تلوين خلية حالة القيد (العمود 9)
                const statusCell = row.getCell(9);
                const sKey = st.status_key || '';
                const sText = st.status || '';

                if (sKey === 'active' || sText === 'نشط') {
                    statusCell.font = { color: { argb: 'FF15803D' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
                } else if (sKey === 'blocked' || sText.includes('محجوب')) {
                    statusCell.font = { color: { argb: 'FFB91C1C' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                } else if (sKey === 'transferred' || sText.includes('منقول') || sText.includes('خريج')) {
                    statusCell.font = { color: { argb: 'FFB45309' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
                } else {
                    statusCell.font = { color: { argb: 'FF64748B' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                }
            });

            // الفلترة التلقائية والحماية
            sheet.autoFilter = `A9:K${9 + studentsList.length}`;
            await sheet.protect('', { 
                selectLockedCells: true, 
                selectUnlockedCells: true, 
                autoFilter: true, 
                sort: true, 
                formatCells: true, 
                formatColumns: true, 
                formatRows: true 
            });

            // 4. توليد وتنزيل ملف Excel
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `students_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export failed:", error);
            Swal.fire({
                title: 'خطأ',
                text: 'حدث خطأ أثناء تصدير ملف الإكسل، يرجى المحاولة مرة أخرى.',
                icon: 'error',
                confirmButtonText: 'حسناً'
            });
        } finally {
            setIsExporting(false);
        }
    };

    // طباعة بطاقات الحسابات للطلاب المطابقين للفلتر الحالي دفعة واحدة
    const handlePrintAllFiltered = async () => {
        const totalCount = students?.total ?? 0;
        if (totalCount === 0) {
            Swal.fire({ title: 'تنبيه', text: 'لا يوجد أي طلاب مطابقين للفلتر الحالي', icon: 'info' });
            return;
        }
        const printCount = totalCount > 500 ? 500 : totalCount;
        const result = await Swal.fire({
            title: 'طباعة بطاقات الحسابات المجمعة',
            text: `سيتم تجهيز وطباعة بطاقات الحسابات لـ (${printCount}) طالب مطابقين للفلتر الحالي دفعة واحدة، هل ترغب في المتابعة؟`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🖨️ بدء الطباعة',
            cancelButtonText: 'إلغاء',
            confirmButtonColor: '#0ea5e9'
        });
        if (!result.isConfirmed) return;

        try {
            setIsPrintingBatch(true);
            const params = {};
            if (debouncedSearch) params.search = debouncedSearch;
            if (selectedYear) params.academic_year_id = selectedYear;
            if (selectedSection) params.section_id = selectedSection;
            if (selectedGrade) params.grade_id = selectedGrade;
            if (selectedDivision) params.division_id = selectedDivision;
            if (statusTab && statusTab !== 'all') params.status_tab = statusTab;
            if (transportFilter) params.transport = transportFilter;
            if (accountStatusFilter) params.account_status = accountStatusFilter;
            if (medicalFilter) params.medical = medicalFilter;

            const res = await axios.get(route('academic.students.credentials-batch'), { params });
            if (res.data?.credentials && res.data.credentials.length > 0) {
                printCredentials(res.data.credentials, logoUrl);
            } else {
                Swal.fire({ title: 'تنبيه', text: 'لم يتم العثور على أي حسابات للطباعة', icon: 'info' });
            }
        } catch (err) {
            Swal.fire({ title: 'خطأ', text: 'تعذر جلب بيانات بطاقات الطلاب', icon: 'error' });
        } finally {
            setIsPrintingBatch(false);
        }
    };

    const handleDownloadCredentialsPdf = () => {
        const params = {};
        if (debouncedSearch) params.search = debouncedSearch;
        if (selectedYear) params.academic_year_id = selectedYear;
        if (selectedSection) params.section_id = selectedSection;
        if (selectedGrade) params.grade_id = selectedGrade;
        if (selectedDivision) params.division_id = selectedDivision;
        if (statusTab && statusTab !== 'all') params.status_tab = statusTab;
        if (transportFilter) params.transport = transportFilter;
        if (accountStatusFilter) params.account_status = accountStatusFilter;
        if (medicalFilter) params.medical = medicalFilter;

        const queryString = new URLSearchParams(params).toString();
        const url = route('academic.students.credentials-pdf') + (queryString ? '?' + queryString : '');
        window.open(url, '_blank');
    };

    const buildStudentModalTarget = (student) => {
        const enroll = student.current_enrollment || student.currentEnrollment;
        const parentPhone = student.parents?.[0]?.phone || '';
        return {
            id: student.id,
            name: student.user?.name || 'طالب',
            username: student.user?.username || String(student.id),
            phone: student.user?.phone || parentPhone || '',
            login_password: student.login_password || null,
            is_active: Boolean(student.user?.is_active ?? true),
            must_change_password: Boolean(student.user?.must_change_password ?? false),
            section_name: enroll?.division?.grade?.section?.name || 'غير محدد',
            grade_name: enroll?.division?.grade?.name || 'غير محدد',
            division_name: enroll?.division?.name || 'غير محدد',
        };
    };

    const openPrintForStudent = (student) => {
        const target = buildStudentModalTarget(student);
        setPrintCredentialsData({
            action: 'view',
            student_id: target.id,
            name: target.name,
            username: target.username,
            password: target.login_password,
            phone: target.phone,
            section_name: target.section_name,
            grade_name: target.grade_name,
            division_name: target.division_name,
            must_change_password: target.must_change_password,
            revoked_tokens: false,
        });
    };

    const openResetForStudent = (student) => {
        setResetPasswordStudent(buildStudentModalTarget(student));
    };

    const handleQuickResetFromPrint = (studentId) => {
        if (!studentId) return;
        router.post(
            route('academic.students.reset-password', studentId),
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

    const handleOpenResetFromPrint = (studentId) => {
        const matched = (students?.data || []).find((s) => s.id === studentId);
        if (matched) {
            setPrintCredentialsData(null);
            openResetForStudent(matched);
        } else if (printCredentialsData) {
            const fallback = {
                id: printCredentialsData.student_id,
                name: printCredentialsData.name,
                username: printCredentialsData.username,
                phone: printCredentialsData.phone || '',
                is_active: true,
                must_change_password: Boolean(printCredentialsData.must_change_password),
                section_name: printCredentialsData.section_name || 'غير محدد',
                grade_name: printCredentialsData.grade_name || 'غير محدد',
                division_name: printCredentialsData.division_name || 'غير محدد',
            };
            setPrintCredentialsData(null);
            setResetPasswordStudent(fallback);
        }
    };

    const handleDownloadSingleStudentPdf = (studentId) => {
        if (!studentId) return;
        const url = route('academic.students.credentials-pdf') + '?student_ids=' + encodeURIComponent(studentId);
        window.open(url, '_blank');
    };

    const handleDownloadSelectedPdf = () => {
        if (selectedStudentIds.length === 0) return;
        const url = route('academic.students.credentials-pdf') + '?student_ids=' + encodeURIComponent(selectedStudentIds.join(','));
        window.open(url, '_blank');
    };

    const handleBulkResetPassword = () => {
        const totalFiltered = students?.total || 0;
        const hasSelection = selectedStudentIds.length > 0;
        Swal.fire({
            title: 'إعادة تعيين كلمات مرور الطلاب جماعياً',
            html: `
                <div dir="rtl" class="text-right space-y-4 mt-2">
                    <div class="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold leading-relaxed">
                        سيتم توليد وحفظ كلمات مرور جديدة للطلاب ضمن النطاق المحدد لتكون جاهزة فوراً للطباعة في ملف PDF.
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">نطاق الطلاب المستهدفين</label>
                        <select id="swal-student-target-scope" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500">
                            ${hasSelection ? `<option value="selected_only">الطلاب المحددون في الجدول فقط (${selectedStudentIds.length})</option>` : ''}
                            <option value="all_filtered">جميع الطلاب في الفلتر الحالي (${totalFiltered})</option>
                            <option value="missing_only">فقط الطلاب الذين ليس لديهم كلمة مرور محفوظة للطباعة</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">نمط توليد كلمة المرور</label>
                        <select id="swal-student-password-mode" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500" onchange="document.getElementById('swal-student-manual-wrap').style.display = this.value === 'manual' ? 'block' : 'none';">
                            <option value="digits_6">تلقائي — 6 أرقام عشوائية لكل طالب (مثال: 347559)</option>
                            <option value="alnum_8">تلقائي — 8 خانات حروف وأرقام لكل طالب</option>
                            <option value="manual">كلمة مرور موحّدة يدوية للجميع</option>
                        </select>
                    </div>
                    <div id="swal-student-manual-wrap" style="display:none;">
                        <label class="block text-xs font-bold text-slate-700 mb-1.5">كلمة المرور الموحّدة</label>
                        <input id="swal-student-manual-password" type="text" placeholder="أدخل كلمة المرور الموحدة (4 خانات فأكثر)" class="w-full border border-slate-300 rounded-xl px-3 py-2 text-sm outline-none focus:border-sky-500" />
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
                const target_scope = document.getElementById('swal-student-target-scope')?.value || 'all_filtered';
                const password_mode = document.getElementById('swal-student-password-mode')?.value || 'digits_6';
                const manual_password = document.getElementById('swal-student-manual-password')?.value || '';
                if (password_mode === 'manual' && manual_password.trim().length < 4) {
                    Swal.showValidationMessage('يرجى إدخال كلمة مرور موحدة لا تقل عن 4 خانات');
                    return false;
                }
                return { target_scope, password_mode, manual_password: manual_password.trim() };
            }
        }).then((result) => {
            if (result.isConfirmed && result.value) {
                const payload = { ...result.value };
                if (payload.target_scope === 'selected_only') {
                    payload.student_ids = selectedStudentIds;
                }
                if (debouncedSearch) payload.search = debouncedSearch;
                if (selectedYear) payload.academic_year_id = selectedYear;
                if (selectedSection) payload.section_id = selectedSection;
                if (selectedGrade) payload.grade_id = selectedGrade;
                if (selectedDivision) payload.division_id = selectedDivision;
                if (statusTab && statusTab !== 'all') payload.status_tab = statusTab;
                if (transportFilter) payload.transport = transportFilter;
                if (accountStatusFilter) payload.account_status = accountStatusFilter;
                if (medicalFilter) payload.medical = medicalFilter;

                router.post(route('academic.students.bulk-reset-password'), payload, {
                    preserveScroll: true,
                });
            }
        });
    };

    // طباعة بطاقات الطلاب المحددين
    const handlePrintSelected = async () => {
        if (selectedStudentIds.length === 0) return;
        try {
            setIsPrintingBatch(true);
            const res = await axios.get(route('academic.students.credentials-batch'), {
                params: { student_ids: selectedStudentIds.join(',') }
            });
            if (res.data?.credentials && res.data.credentials.length > 0) {
                printCredentials(res.data.credentials, logoUrl);
            } else {
                Swal.fire({ title: 'تنبيه', text: 'لم يتم العثور على بيانات للطلاب المحددين', icon: 'info' });
            }
        } catch (err) {
            Swal.fire({ title: 'خطأ', text: 'تعذر جلب بيانات بطاقات الطلاب المحددين', icon: 'error' });
        } finally {
            setIsPrintingBatch(false);
        }
    };

    // إدارة التحديد
    const currentPageStudentIds = (students?.data || []).map(s => s.id);
    const isAllCurrentPageSelected = currentPageStudentIds.length > 0 && currentPageStudentIds.every(id => selectedStudentIds.includes(id));

    const toggleSelectAll = () => {
        if (isAllCurrentPageSelected) {
            setSelectedStudentIds(prev => prev.filter(id => !currentPageStudentIds.includes(id)));
        } else {
            setSelectedStudentIds(prev => Array.from(new Set([...prev, ...currentPageStudentIds])));
        }
    };

    const toggleSelectStudent = (id) => {
        setSelectedStudentIds(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // Auto-trigger print modal if credentials were generated
    useEffect(() => {
        if (flash?.generated_credentials) {
            const creds = flash.generated_credentials;
            const flashKey = creds.issued_at || JSON.stringify(creds);
            if (lastFlashKeyRef.current !== flashKey) {
                lastFlashKeyRef.current = flashKey;
                setPrintCredentialsData(creds);
            }
        } else if (flash?.success && flash.success.includes('من الطلاب بنجاح')) {
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
    }, [flash]);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 450);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        const query = {};
        if (debouncedSearch) query.search = debouncedSearch;
        if (selectedYear) query.academic_year_id = selectedYear;
        if (selectedSection) query.section_id = selectedSection;
        if (selectedGrade) query.grade_id = selectedGrade;
        if (selectedDivision) query.division_id = selectedDivision;
        if (statusTab && statusTab !== 'all') query.status_tab = statusTab;
        if (transportFilter) query.transport = transportFilter;
        if (accountStatusFilter) query.account_status = accountStatusFilter;
        if (medicalFilter) query.medical = medicalFilter;
        if (perPage && perPage !== 15) query.per_page = perPage;

        router.get(route('academic.students'), query, { 
            preserveState: true, 
            preserveScroll: true,
            replace: true 
        });
    }, [
        debouncedSearch, 
        selectedYear, 
        selectedSection, 
        selectedGrade, 
        selectedDivision, 
        statusTab, 
        transportFilter, 
        accountStatusFilter, 
        medicalFilter, 
        perPage
    ]);

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

    // تجميع شارات الفلاتر النشطة (Active Chips)
    const activeChips = [];
    if (debouncedSearch) {
        activeChips.push({
            id: 'search',
            label: `بحث: "${debouncedSearch}"`,
            onRemove: () => { setSearchTerm(''); setDebouncedSearch(''); }
        });
    }
    if (selectedYear) {
        const yr = (academicYears || []).find(y => String(y.id) === String(selectedYear));
        activeChips.push({
            id: 'year',
            label: `السنة: ${yr?.name || selectedYear}`,
            onRemove: () => setSelectedYear('')
        });
    }
    if (selectedSection) {
        const sec = (sections || []).find(s => String(s.id) === String(selectedSection));
        activeChips.push({
            id: 'section',
            label: `المرحلة: ${sec?.name || selectedSection}`,
            onRemove: () => handleSectionChange('')
        });
    }
    if (selectedGrade) {
        const grd = (availableGrades || []).find(g => String(g.id) === String(selectedGrade));
        activeChips.push({
            id: 'grade',
            label: `الصف: ${grd?.name || selectedGrade}`,
            onRemove: () => handleGradeChange('')
        });
    }
    if (selectedDivision) {
        const div = (availableDivisions || []).find(d => String(d.id) === String(selectedDivision));
        activeChips.push({
            id: 'division',
            label: `الشعبة: ${div?.name || selectedDivision}`,
            onRemove: () => setSelectedDivision('')
        });
    }
    if (statusTab && statusTab !== 'all') {
        const statusLabels = {
            active: 'النشطون فقط',
            unregistered: 'غير مسجلين',
            transferred: 'منقولون / مسحوبون',
            blocked: 'محجوبو النتيجة'
        };
        activeChips.push({
            id: 'status_tab',
            label: `الحالة: ${statusLabels[statusTab] || statusTab}`,
            onRemove: () => setStatusTab('all')
        });
    }
    if (transportFilter) {
        activeChips.push({
            id: 'transport',
            label: transportFilter === '1' ? 'مشترك بالنقل 🚌' : 'غير مشترك بالنقل',
            onRemove: () => setTransportFilter('')
        });
    }
    if (accountStatusFilter) {
        const accLabels = {
            active: 'حساب مفعّل',
            inactive: 'حساب معطل',
            must_change_password: 'بانتظار تفعيل كلمة المرور'
        };
        activeChips.push({
            id: 'account_status',
            label: `الحساب: ${accLabels[accountStatusFilter] || accountStatusFilter}`,
            onRemove: () => setAccountStatusFilter('')
        });
    }
    if (medicalFilter) {
        activeChips.push({
            id: 'medical',
            label: medicalFilter === 'has_record' ? 'لديه ملف طبي 🩺' : 'بدون ملف طبي',
            onRemove: () => setMedicalFilter('')
        });
    }
    if (perPage && perPage !== 15) {
        activeChips.push({
            id: 'per_page',
            label: `${perPage} طالب / صفحة`,
            onRemove: () => setPerPage(15)
        });
    }

    const activeAdvancedCount = [transportFilter, accountStatusFilter, medicalFilter, perPage !== 15 ? perPage : ''].filter(Boolean).length;

    return (
        <AdminLayout activeMenu="الطلاب">
            <Head title="الطلاب | النظام الأكاديمي" />

            <div className="space-y-6 animate-fade-in">
                {/* Header & Actions */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/80 via-white to-emerald-50/40 dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/15 rounded-3xl p-6 md:p-7 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1.5 bg-gradient-to-r from-primary-500 via-emerald-500 to-primary-700" />
                    
                    <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary-500/25 shrink-0">
                                <GraduationCap size={28} strokeWidth={1.7} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2.5">
                                    <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">الطلاب المسجلون</h1>
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-primary-100/80 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300 border border-primary-200/70 dark:border-primary-500/25">
                                        <Users size={13} />
                                        <span className="font-mono">{students?.total ?? 0}</span> طالب
                                    </span>
                                </div>
                                <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
                                    إدارة الملفات الأكاديمية، حسابات الدخول، الشهادات، وكشوف الدرجات للطلاب
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto xl:justify-end">
                            {/* Credentials Action Group */}
                            <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 dark:bg-slate-800/70 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/70">
                                <button
                                    onClick={handleBulkResetPassword}
                                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                                    title="إعادة تعيين كلمات المرور لجميع الطلاب الظاهرين في الفلتر الحالي أو المحددين"
                                >
                                    <KeyRound size={15} />
                                    <span>إعادة تعيين كلمات المرور</span>
                                </button>
                                <button
                                    onClick={handleDownloadCredentialsPdf}
                                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-800/50 hover:bg-rose-50 dark:hover:bg-rose-950/30 px-3.5 py-2 rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
                                    title="طباعة بيانات الدخول (اسم المستخدم وكلمة المرور) لجميع الطلاب الظاهرين في الفلتر الحالي بصيغة PDF"
                                >
                                    <Printer size={15} />
                                    <span>بيانات الدخول PDF</span>
                                </button>
                            </div>

                            {/* Data Tools Group */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handlePrintAllFiltered}
                                    disabled={isPrintingBatch}
                                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-800/60 hover:bg-sky-50 dark:hover:bg-sky-950/30 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95 disabled:opacity-50"
                                    title="طباعة بطاقات حسابات الطلاب الظاهرين في الفلتر الحالي"
                                >
                                    <Printer size={16} />
                                    <span className="hidden sm:inline">طباعة سريعة</span>
                                </button>
                                <button
                                    onClick={exportToExcel}
                                    disabled={isExporting}
                                    className="flex items-center justify-center p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary-600 transition-colors shadow-sm disabled:opacity-50"
                                    title="تصدير إكسيل"
                                >
                                    {isExporting ? <RotateCcw size={17} className="animate-spin" /> : <Download size={17} />}
                                </button>
                                <button
                                    onClick={() => setShowImportModal(true)}
                                    className="flex items-center justify-center gap-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 px-3.5 py-2.5 rounded-2xl text-xs font-bold shadow-sm transition-all active:scale-95"
                                    title="استيراد الطلاب من إكسيل"
                                >
                                    <Upload size={16} />
                                    <span className="hidden sm:inline">استيراد</span>
                                </button>
                            </div>

                            <Link
                                href={route('academic.students.create')}
                                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold shadow-lg shadow-primary-500/25 transition-all hover:-translate-y-0.5 shrink-0 active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل طالب جديد</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* 2. بطاقات مؤشرات حالة القيد التفاعلية (Interactive KPI Status Cards) */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 relative z-10">
                    {[
                        {
                            id: 'all',
                            label: 'جميع الطلاب',
                            icon: Users,
                            count: statusCounts?.all ?? students?.total ?? 0,
                            activeCls: 'bg-primary-50/90 dark:bg-primary-500/15 border-primary-400 dark:border-primary-500/50 ring-2 ring-primary-500/15',
                            iconCls: 'bg-primary-100 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300',
                            countCls: 'text-primary-700 dark:text-primary-300',
                            barCls: 'bg-primary-500',
                        },
                        {
                            id: 'active',
                            label: 'الطلاب النشطون',
                            icon: CheckCircle2,
                            count: statusCounts?.active ?? 0,
                            activeCls: 'bg-emerald-50/90 dark:bg-emerald-500/15 border-emerald-400 dark:border-emerald-500/50 ring-2 ring-emerald-500/15',
                            iconCls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300',
                            countCls: 'text-emerald-700 dark:text-emerald-400',
                            barCls: 'bg-emerald-500',
                        },
                        {
                            id: 'unregistered',
                            label: 'غير مسجلين بشعبة',
                            icon: AlertCircle,
                            count: statusCounts?.unregistered ?? 0,
                            activeCls: 'bg-amber-50/90 dark:bg-amber-500/15 border-amber-400 dark:border-amber-500/50 ring-2 ring-amber-500/15',
                            iconCls: 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300',
                            countCls: 'text-amber-700 dark:text-amber-400',
                            barCls: 'bg-amber-500',
                        },
                        {
                            id: 'transferred',
                            label: 'منقولون / مسحوبون',
                            icon: ShieldAlert,
                            count: statusCounts?.transferred ?? 0,
                            activeCls: 'bg-sky-50/90 dark:bg-sky-500/15 border-sky-400 dark:border-sky-500/50 ring-2 ring-sky-500/15',
                            iconCls: 'bg-sky-100 text-sky-700 dark:bg-sky-500/20 dark:text-sky-300',
                            countCls: 'text-sky-700 dark:text-sky-400',
                            barCls: 'bg-sky-500',
                        },
                        {
                            id: 'blocked',
                            label: 'محجوبو النتيجة',
                            icon: Ban,
                            count: statusCounts?.blocked ?? 0,
                            activeCls: 'bg-rose-50/90 dark:bg-rose-500/15 border-rose-400 dark:border-rose-500/50 ring-2 ring-rose-500/15',
                            iconCls: 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300',
                            countCls: 'text-rose-700 dark:text-rose-400',
                            barCls: 'bg-rose-500',
                        },
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = statusTab === tab.id;
                        const totalBase = Math.max(statusCounts?.all ?? students?.total ?? 0, 1);
                        const pct = tab.id === 'all' ? 100 : Math.min(100, Math.round((tab.count / totalBase) * 100));

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setStatusTab(tab.id)}
                                className={`text-right p-4 rounded-2xl border transition-all select-none group ${
                                    isActive
                                        ? `${tab.activeCls} shadow-sm`
                                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2 mb-2.5">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">{tab.label}</span>
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${tab.iconCls}`}>
                                        <Icon size={16} />
                                    </div>
                                </div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <span className={`text-2xl font-black font-mono ${tab.countCls}`}>{tab.count}</span>
                                    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 font-mono">{pct}%</span>
                                </div>
                                <div className="mt-2.5 h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-300 ${tab.barCls}`} style={{ width: `${pct}%` }} />
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* 1 & 4. شريط الفلترة الرئيسي: البحث الذكي + الفلترة الهرمية التتابعية */}
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative z-10 space-y-4">
                    <div className="flex flex-col xl:flex-row gap-3">
                        {/* Smart Search */}
                        <div className="relative group flex-1 min-w-[240px]">
                            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary-500 transition-colors" size={17} />
                            <input
                                type="text"
                                placeholder="بحث باسم الطالب، اسم المستخدم، الهوية، الهاتف، أو ولي الأمر..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 rounded-2xl pr-10 pl-9 py-2.5 text-xs font-semibold outline-none transition-all dark:text-white placeholder:text-slate-400"
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(''); setDebouncedSearch(''); }}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full transition-colors"
                                    title="مسح البحث"
                                >
                                    <X size={15} />
                                </button>
                            )}
                        </div>

                        {/* Cascading Dropdowns: سنة -> مرحلة -> صف -> شعبة */}
                        <div className="flex flex-wrap sm:flex-nowrap gap-2 shrink-0">
                            {/* السنة الدراسية */}
                            <div className="w-full sm:w-36 shrink-0">
                                <SelectInput
                                    options={(academicYears || []).map(y => ({ value: y.id, label: y.name }))}
                                    value={selectedYear}
                                    onChange={setSelectedYear}
                                    placeholder="السنة الدراسية"
                                />
                            </div>

                            {/* المرحلة / القسم */}
                            <div className="w-full sm:w-40 shrink-0">
                                <SelectInput
                                    options={(sections || []).map(s => ({ value: s.id, label: s.name }))}
                                    value={selectedSection}
                                    onChange={handleSectionChange}
                                    placeholder="المرحلة / القسم"
                                />
                            </div>

                            {/* الصف الدراسي (مربوط تتابعياً بالقسم) */}
                            <div className="w-full sm:w-36 shrink-0">
                                <SelectInput
                                    options={(availableGrades || []).map(g => ({ value: g.id, label: g.name }))}
                                    value={selectedGrade}
                                    onChange={handleGradeChange}
                                    placeholder={selectedSection ? "كل الصفوف" : "الصف الدراسي"}
                                    isDisabled={!selectedSection || availableGrades.length === 0}
                                />
                            </div>

                            {/* الشعبة (مربوطة تتابعياً بالصف) */}
                            <div className="w-full sm:w-32 shrink-0">
                                <SelectInput
                                    options={(availableDivisions || []).map(d => ({ value: d.id, label: d.name }))}
                                    value={selectedDivision}
                                    onChange={setSelectedDivision}
                                    placeholder={selectedGrade ? "كل الشعب" : "الشعبة"}
                                    isDisabled={!selectedGrade || availableDivisions.length === 0}
                                />
                            </div>

                            {/* زر الفلاتر المتقدمة */}
                            <button
                                onClick={() => setShowAdvancedModal(true)}
                                className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold border transition-all shrink-0 select-none h-[42px] ${
                                    activeAdvancedCount > 0
                                        ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30 text-primary-600 dark:text-primary-400 shadow-sm'
                                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                }`}
                                title="فلاتر بحث إضافية"
                            >
                                <SlidersHorizontal size={15} />
                                <span className="hidden md:inline">متقدم</span>
                                {activeAdvancedCount > 0 && (
                                    <span className="w-4 h-4 rounded-full bg-primary-500 text-white text-[10px] flex items-center justify-center font-bold">
                                        {activeAdvancedCount}
                                    </span>
                                )}
                            </button>

                            {/* مفتاح طريقة العرض (جدول / بطاقات) */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl shrink-0 h-[42px] items-center">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                                        viewMode === 'table' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                    title="عرض كجدول"
                                >
                                    <List size={16} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`flex items-center justify-center px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                                        viewMode === 'grid' ? 'bg-white dark:bg-slate-700 text-primary-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                    title="عرض كبطاقات"
                                >
                                    <LayoutGrid size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 5. شارات الفلاتر النشطة وزر مسح الكل (Active Chips & Reset) */}
                    {activeChips.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 animate-fade-in">
                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1 ml-1">
                                <Filter size={12} />
                                الفلاتر النشطة:
                            </span>
                            {activeChips.map(chip => (
                                <span
                                    key={chip.id}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-500/20"
                                >
                                    {chip.label}
                                    <button
                                        onClick={chip.onRemove}
                                        className="hover:text-rose-600 dark:hover:text-rose-400 p-0.5 rounded-full transition-colors"
                                        title="إزالة هذا الفلتر"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <button
                                onClick={handleClearAllFilters}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors mr-auto"
                            >
                                <RefreshCw size={11} />
                                مسح جميع الفلاتر
                            </button>
                        </div>
                    )}
                </div>

                {/* Students View */}
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(students?.data || []).length > 0 ? (
                            students.data.map((student) => {
                                const enroll = student.current_enrollment;
                                const studentName = student.user?.name || 'طالب';
                                const studentUsername = student.user?.username || student.id;
                                const initialChar = student.user?.name ? student.user.name.charAt(0) : 'ط';
                                const hasSavedPassword = Boolean(student.login_password);
                                const parentObj = student.parents?.[0];
                                const contactPhone = student.user?.phone || parentObj?.phone || '';

                                return (
                                    <div key={student.id} className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border shadow-sm hover:shadow-md transition-all group flex flex-col h-full ${
                                        selectedStudentIds.includes(student.id)
                                            ? 'border-primary-500 ring-2 ring-primary-500/20'
                                            : 'border-slate-200 dark:border-slate-800'
                                    }`}>
                                        {/* Top Card Toolbar (No Overlap) */}
                                        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); toggleSelectStudent(student.id); }}
                                                    className={`p-1.5 rounded-xl transition-all ${
                                                        selectedStudentIds.includes(student.id)
                                                            ? 'bg-primary-500 text-white shadow-sm'
                                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-primary-600'
                                                    }`}
                                                    title={selectedStudentIds.includes(student.id) ? "إلغاء تحديد الطالب" : "تحديد الطالب"}
                                                >
                                                    {selectedStudentIds.includes(student.id) ? <CheckSquare size={15} /> : <Square size={15} />}
                                                </button>
                                                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                                                    hasSavedPassword
                                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20'
                                                        : 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20'
                                                }`}>
                                                    {hasSavedPassword ? 'جاهز للطباعة ✓' : 'بدون كلمة محفوظة'}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <button
                                                    onClick={() => openPrintForStudent(student)}
                                                    className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                                    title="طباعة بيانات الدخول"
                                                >
                                                    <Printer size={15} />
                                                </button>
                                                <button
                                                    onClick={() => openResetForStudent(student)}
                                                    className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors"
                                                    title="إعادة تعيين كلمة المرور"
                                                >
                                                    <KeyRound size={15} />
                                                </button>
                                                <Link
                                                    href={route('academic.students.edit', student.id)}
                                                    className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                    title="تعديل الطالب"
                                                >
                                                    <Edit size={15} />
                                                </Link>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                    title="حذف الطالب"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Student Identity */}
                                        <div className="flex items-center gap-3.5 mb-4">
                                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-lg border border-primary-200/60 dark:border-primary-500/20 shrink-0 shadow-inner">
                                                {initialChar}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <h3 className="text-base font-black text-slate-800 dark:text-white truncate">
                                                        {highlightText(studentName, debouncedSearch)}
                                                    </h3>
                                                    {student.transport_subscription && (
                                                        <span title="مشترك بالنقل" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">🚌</span>
                                                    )}
                                                    {student.medical_record && (
                                                        <span title="سجل طبي بالعيادة" className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-1.5 py-0.5 rounded font-bold">🩺</span>
                                                    )}
                                                    {enroll?.is_result_blocked && (
                                                        <span title="محجوب النتيجة" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-1.5 py-0.5 rounded font-bold">⛔</span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                                                    <span className="font-mono">@{highlightText(studentUsername, debouncedSearch)}</span>
                                                    {student.user?.national_id && (
                                                        <span className="text-[11px] text-slate-400">| هـ: {highlightText(student.user.national_id, debouncedSearch)}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Academic & Parent Widget */}
                                        <div className="mb-4 p-3.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex-grow space-y-2.5">
                                            {enroll ? (
                                                <>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                            enroll.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                            enroll.status === 'transferred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                            'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                                        }`}>
                                                            {enroll.status === 'active' ? 'نشط' : enroll.status === 'transferred' ? 'منقول' : 'مسحوب/خريج'}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-primary-600 dark:text-primary-400">{enroll.academic_year?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
                                                        <Building2 size={14} className="text-primary-500 shrink-0" />
                                                        <span className="font-bold">{enroll.division?.grade?.section?.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                                                        <BookOpen size={14} className="text-primary-500 shrink-0" />
                                                        <span>{enroll.division?.grade?.name} — {enroll.division?.name}</span>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="py-2 flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                                    <ShieldAlert size={18} className="shrink-0" />
                                                    <div>
                                                        <p className="text-xs font-bold">غير مسجل في أي شعبة</p>
                                                        <p className="text-[11px] text-slate-500">لا يوجد قيد أكاديمي نشط حالياً</p>
                                                    </div>
                                                </div>
                                            )}

                                            {(parentObj || contactPhone) && (
                                                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-[11px]">
                                                    <span className="text-indigo-600 dark:text-indigo-400 font-bold truncate">
                                                        {parentObj ? `ولي الأمر: ${parentObj.name}` : 'جوال الطالب'}
                                                    </span>
                                                    {contactPhone && (
                                                        <span className="font-mono text-slate-500 dark:text-slate-400 shrink-0" dir="ltr">{contactPhone}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Footer Quick Links */}
                                        <div className="border-t border-slate-100 dark:border-slate-800 pt-3 flex items-center justify-between gap-2 mt-auto">
                                            <div className="flex gap-2 items-center">
                                                <Link href={route('academic.certificates.index', { student_id: student.id })} className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold hover:bg-emerald-100 transition-colors">
                                                    الشهادات
                                                </Link>
                                                <Link href={route('academic.students.grade-report', student.id)} className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold hover:bg-indigo-100 transition-colors">
                                                    كشف الدرجات
                                                </Link>
                                            </div>
                                            <Link href={route('academic.students.edit', student.id)} className="text-xs font-bold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 transition-colors">
                                                الملف الكامل &larr;
                                            </Link>
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
                                    <tr className="bg-slate-50/90 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase">
                                        <th className="p-4 w-12 text-center">
                                            <button
                                                type="button"
                                                onClick={toggleSelectAll}
                                                className="text-slate-400 hover:text-primary-600 transition-colors inline-flex items-center justify-center"
                                                title={isAllCurrentPageSelected ? "إلغاء تحديد الصفحة الحالية" : "تحديد كل طلاب الصفحة الحالية"}
                                            >
                                                {isAllCurrentPageSelected ? (
                                                    <CheckSquare size={18} className="text-primary-600 dark:text-primary-400" />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </th>
                                        <th className="p-4 font-extrabold">الطالب</th>
                                        <th className="p-4 font-extrabold">المرحلة والصف والشعبة</th>
                                        <th className="p-4 font-extrabold">ولي الأمر والتواصل</th>
                                        <th className="p-4 font-extrabold">الحالة وبيانات الدخول</th>
                                        <th className="p-4 font-extrabold text-center">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                                    {(students?.data || []).length > 0 ? (
                                        students.data.map((student) => {
                                            const enroll = student.current_enrollment;
                                            const studentName = student.user?.name || 'طالب';
                                            const studentUsername = student.user?.username || student.id;
                                            const initialChar = student.user?.name ? student.user.name.charAt(0) : 'ط';
                                            const hasSavedPassword = Boolean(student.login_password);
                                            const parentObj = student.parents?.[0];
                                            const contactPhone = student.user?.phone || parentObj?.phone || '';

                                            return (
                                                <tr key={student.id} className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors ${
                                                    selectedStudentIds.includes(student.id) ? 'bg-primary-50/40 dark:bg-primary-950/20' : ''
                                                }`}>
                                                    <td className="p-4 text-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSelectStudent(student.id)}
                                                            className="text-slate-400 hover:text-primary-600 transition-colors inline-flex items-center justify-center"
                                                            title={selectedStudentIds.includes(student.id) ? "إلغاء تحديد" : "تحديد"}
                                                        >
                                                            {selectedStudentIds.includes(student.id) ? (
                                                                <CheckSquare size={18} className="text-primary-600 dark:text-primary-400" />
                                                            ) : (
                                                                <Square size={18} />
                                                            )}
                                                        </button>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3.5">
                                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/40 dark:to-primary-800/40 flex items-center justify-center text-primary-700 dark:text-primary-300 font-black text-base shrink-0">
                                                                {initialChar}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                                                        {highlightText(studentName, debouncedSearch)}
                                                                    </h3>
                                                                    {student.transport_subscription && (
                                                                        <span title="مشترك بالنقل المدرسي" className="text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300 px-1.5 py-0.5 rounded-md font-bold">🚌 باص</span>
                                                                    )}
                                                                    {student.medical_record && (
                                                                        <span title="سجل طبي بالعيادة" className="text-[10px] bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300 px-1.5 py-0.5 rounded-md font-bold">🩺 عيادة</span>
                                                                    )}
                                                                    {enroll?.is_result_blocked && (
                                                                        <span title="محجوب النتيجة" className="text-[10px] bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300 px-1.5 py-0.5 rounded-md font-bold">⛔ محجوب</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                                                                    <span className="font-mono">@{highlightText(studentUsername, debouncedSearch)}</span>
                                                                    {student.user?.national_id && (
                                                                        <span className="text-[11px] text-slate-400">| هـ: {highlightText(student.user.national_id, debouncedSearch)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        {enroll ? (
                                                            <div>
                                                                <p className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                                                                    {enroll.division?.grade?.section?.name}
                                                                </p>
                                                                <div className="flex items-center gap-1.5 mt-1">
                                                                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold">
                                                                        {enroll.division?.grade?.name} - {enroll.division?.name}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-slate-400 text-xs font-bold">غير محدد</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="space-y-1">
                                                            {parentObj ? (
                                                                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                                                    {highlightText(parentObj.name, debouncedSearch)}
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-slate-400">بدون ولي أمر مرتبط</span>
                                                            )}
                                                            {contactPhone && (
                                                                <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-1" dir="ltr">
                                                                    <Phone size={11} className="text-slate-400 shrink-0" />
                                                                    <span>{highlightText(contactPhone, debouncedSearch)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex flex-col items-start gap-1.5">
                                                            {enroll ? (
                                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${
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
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                    <ShieldAlert size={11} /> غير مسجل
                                                                </span>
                                                            )}
                                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                                                hasSavedPassword
                                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-500/20'
                                                                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 border border-amber-200/70 dark:border-amber-500/20'
                                                            }`}>
                                                                {hasSavedPassword ? 'كلمة المرور جاهزة ✓' : 'بدون كلمة محفوظة'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                            <button
                                                                onClick={() => openPrintForStudent(student)}
                                                                className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center hover:bg-emerald-100 transition-colors"
                                                                title="بطاقة الدخول والطباعة"
                                                            >
                                                                <Printer size={15} />
                                                            </button>
                                                            <button
                                                                onClick={() => openResetForStudent(student)}
                                                                className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center hover:bg-amber-100 transition-colors"
                                                                title="إعادة تعيين كلمة المرور"
                                                            >
                                                                <KeyRound size={15} />
                                                            </button>
                                                            <Link
                                                                href={route('academic.students.grade-report', student.id)}
                                                                className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center hover:bg-indigo-100 transition-colors"
                                                                title="كشف الدرجات"
                                                            >
                                                                <BookOpen size={15} />
                                                            </Link>
                                                            <Link
                                                                href={route('academic.certificates.index', { student_id: student.id })}
                                                                className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center hover:bg-teal-100 transition-colors"
                                                                title="الشهادات"
                                                            >
                                                                <GraduationCap size={15} />
                                                            </Link>
                                                            <Link
                                                                href={route('academic.students.edit', student.id)}
                                                                className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center hover:bg-blue-100 transition-colors"
                                                                title="تعديل الطالب"
                                                            >
                                                                <Edit size={15} />
                                                            </Link>
                                                            <button
                                                                onClick={() => handleDelete(student.id)}
                                                                className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center hover:bg-rose-100 transition-colors"
                                                                title="حذف"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="p-12 text-center">
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

                {/* Rich Pagination Footer */}
                {students && (students.total > 0 || (students.links && students.links.length > 3)) && (
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl px-5 py-3.5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <span>
                                عرض <strong className="text-slate-800 dark:text-white font-mono">{students.from || 0}</strong> إلى{' '}
                                <strong className="text-slate-800 dark:text-white font-mono">{students.to || 0}</strong> من أصل{' '}
                                <strong className="text-primary-600 dark:text-primary-400 font-mono">{students.total || 0}</strong> طالب
                            </span>
                            <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3">
                                <span>لكل صفحة:</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => setPerPage(Number(e.target.value))}
                                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 outline-none focus:border-primary-500"
                                >
                                    {[15, 30, 50, 100].map((num) => (
                                        <option key={num} value={num}>{num}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {students?.links && students.links.length > 3 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                                {students.links.map((link, index) => {
                                    if (!link.url) {
                                        return (
                                            <span
                                                key={index}
                                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            preserveScroll
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                link.active
                                                    ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30'
                                                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 6. شريط العمليات الجماعية العائم عند التحديد (Floating Bulk Actions Bar) */}
            {selectedStudentIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white px-5 py-3 rounded-3xl shadow-2xl border border-slate-700/60 flex flex-wrap items-center gap-3 animate-fade-in max-w-3xl w-[94%] sm:w-auto justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-full bg-primary-500 text-white font-mono font-black text-xs flex items-center justify-center shadow-inner">
                            {selectedStudentIds.length}
                        </span>
                        <span className="text-sm font-bold text-slate-200">
                            طالب محدد
                        </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={handleDownloadSelectedPdf}
                            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md"
                        >
                            <Printer size={14} />
                            <span>بطاقات المحددين PDF ({selectedStudentIds.length})</span>
                        </button>

                        <button
                            type="button"
                            onClick={handlePrintSelected}
                            disabled={isPrintingBatch}
                            className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-500 active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                        >
                            <Printer size={14} />
                            <span>طباعة سريعة</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleBulkResetPassword}
                            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-md"
                        >
                            <KeyRound size={14} />
                            <span>إعادة تعيين كلمات المرور</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setSelectedStudentIds([])}
                            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                            title="إلغاء تحديد الكل"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* 4. نافذة الفلاتر المتقدمة (Advanced Filters Modal) */}
            {showAdvancedModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <SlidersHorizontal size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 dark:text-white">فلاتر البحث المتقدمة</h3>
                                    <p className="text-xs text-slate-500">تخصيص شروط الفلترة الدقيقة لسجل الطلاب</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAdvancedModal(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* اشتراك النقل المدرسي */}
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <Bus size={15} className="text-amber-500" />
                                    اشتراك النقل المدرسي (الباص)
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: '', label: 'الكل' },
                                        { value: '1', label: 'مشترك 🚌' },
                                        { value: '0', label: 'غير مشترك' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setTransportFilter(opt.value)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                transportFilter === opt.value
                                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* حالة حساب المستخدم */}
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <KeyRound size={15} className="text-emerald-500" />
                                    حالة حساب الطالب
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {[
                                        { value: '', label: 'جميع الحسابات' },
                                        { value: 'active', label: 'حساب مفعّل' },
                                        { value: 'inactive', label: 'حساب معطل' },
                                        { value: 'must_change_password', label: 'بانتظار تغيير كلمة المرور' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setAccountStatusFilter(opt.value)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                accountStatusFilter === opt.value
                                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* الملف الطبي */}
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                                    <Stethoscope size={15} className="text-rose-500" />
                                    السجل الطبي بالعيادة
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { value: '', label: 'الكل' },
                                        { value: 'has_record', label: 'لديه ملف طبي 🩺' },
                                        { value: 'no_record', label: 'بدون ملف' }
                                    ].map(opt => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => setMedicalFilter(opt.value)}
                                            className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                                medicalFilter === opt.value
                                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* عدد العناصر بالصفحة */}
                            <div>
                                <label className="text-xs font-black text-slate-700 dark:text-slate-300 mb-2 block">
                                    عدد الطلاب المعروضين بالصفحة
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[15, 30, 50, 100].map(num => (
                                        <button
                                            key={num}
                                            type="button"
                                            onClick={() => setPerPage(num)}
                                            className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                                                perPage === num
                                                    ? 'bg-primary-500 text-white border-primary-500 shadow-sm'
                                                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                                            }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setTransportFilter('');
                                    setAccountStatusFilter('');
                                    setMedicalFilter('');
                                    setPerPage(15);
                                }}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 px-3 py-2 rounded-xl transition-colors"
                            >
                                تفريغ الفلاتر المتقدمة
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowAdvancedModal(false)}
                                className="px-6 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-xs font-bold shadow-lg shadow-primary-500/30 transition-all"
                            >
                                تم وتطبيق
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ImportModal 
                show={showImportModal} 
                onClose={() => setShowImportModal(false)} 
                onSuccess={(importedCredentials) => {
                    setShowImportModal(false);
                    router.reload({ only: ['students'] });
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

            <ResetPasswordModal
                isOpen={!!resetPasswordStudent}
                student={resetPasswordStudent}
                onClose={() => setResetPasswordStudent(null)}
            />

            <CredentialsPrintModal
                isOpen={!!printCredentialsData}
                credentials={printCredentialsData}
                logoUrl={logoUrl}
                isQuickResetting={isQuickResetting}
                onClose={() => setPrintCredentialsData(null)}
                onOpenResetPassword={handleOpenResetFromPrint}
                onQuickResetPassword={handleQuickResetFromPrint}
                onDownloadSinglePdf={handleDownloadSingleStudentPdf}
            />
        </AdminLayout>
    );
}
