import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, FileText, CheckCircle2, Search, Filter, ChevronDown, ChevronUp, RefreshCw, LayoutGrid, List, MapPin, GraduationCap, Layers, AlignLeft, CalendarDays, Building2, Download, AlertCircle, Clock, CheckSquare } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import ExcelJS from 'exceljs';

export default function HolidaysIndex({ holidays, branches, academicYears, isAdmin, filters }) {
    const { logo_url } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    // Filter States
    const [searchTerm, setSearchTerm] = useState(filters?.search || '');
    const [selectedYear, setSelectedYear] = useState(filters?.academic_year_id || '');
    const [selectedSemester, setSelectedSemester] = useState(filters?.semester_id || '');
    const [selectedBranch, setSelectedBranch] = useState(filters?.branch_id || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [showFilters, setShowFilters] = useState(false);

    // View Mode State
    const [viewMode, setViewMode] = useState('table');

    // Bulk Select State
    const [selectedHolidays, setSelectedHolidays] = useState([]);

    // Export to Excel Function
    const exportToExcel = async () => {
        if (!holidays || holidays.length === 0) {
            Swal.fire({ title: 'لا يوجد بيانات', text: 'لا يوجد إجازات لتصديرها', icon: 'info' });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('الإجازات', { views: [{ rightToLeft: true }] });

        // Add Logo
        let logoId = null;
        if (logo_url) {
            const getLogoBase64 = async (url) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png').split(',')[1]);
                    };
                    img.onerror = () => resolve(null);
                    img.src = url;
                });
            };
            const base64Clean = await getLogoBase64(logo_url);
            if (base64Clean) {
                logoId = workbook.addImage({ base64: base64Clean, extension: 'png' });
            }
        }

        // Columns width
        sheet.columns = [
            { width: 35 }, // A: اسم الإجازة
            { width: 15 }, // B: تاريخ البدء
            { width: 15 }, // C: تاريخ الانتهاء
            { width: 25 }, // D: الفرع
            { width: 20 }, // E: السنة الدراسية
            { width: 15 }, // F: الفصل الدراسي
            { width: 40 }, // G: ملاحظات
            { width: 15 }  // H: الحالة
        ];

        // Insert logo if exists
        if (logoId !== null) {
            const logoColIndex = 3.8; // roughly center
            sheet.addImage(logoId, { tl: { col: logoColIndex, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        // Add Top Border / Accent Line
        sheet.getRow(1).height = 10;
        sheet.mergeCells('A1:H1');
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } }; // Brand Green

        // Title Rows
        sheet.mergeCells('A2:C2');
        const titleCell = sheet.getCell('A2');
        titleCell.value = 'مدارس القيم الأهلية';
        titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF6B9B37' } };
        titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A3:C3');
        const enTitleCell = sheet.getCell('A3');
        enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
        enTitleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF6B9B37' } };
        enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A4:C4');
        const subTitleCell = sheet.getCell('A4');
        subTitleCell.value = 'النظام الإداري - الإجازات الرسمية والعطلات';
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // Meta data on the left
        sheet.mergeCells('F2:H2');
        const typeCell = sheet.getCell('F2');
        typeCell.value = 'نوع التقرير: سجل الإجازات والعطلات';
        typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const printDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells('F3:H3');
        const dateCell = sheet.getCell('F3');
        dateCell.value = `تاريخ التصدير: ${printDate}`;
        dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.mergeCells('F4:H4');
        const statusCell = sheet.getCell('F4');
        statusCell.value = 'حالة التقرير: معتمد ✔';
        statusCell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
        statusCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        // Row 5: Empty Spacer
        sheet.getRow(5).height = 15;

        // Statistics Bar
        const statRowIndex = 7;
        const totalHolidays = holidays?.length || 0;
        const upcomingHolidays = holidays?.filter(h => new Date(h.start_date) > new Date() && (new Date(h.start_date) - new Date()) / (1000 * 60 * 60 * 24) <= 30).length || 0;
        const branchSpecificHolidays = holidays?.filter(h => h.branch_id).length || 0;
        const generalHolidays = totalHolidays - branchSpecificHolidays;

        sheet.mergeCells(`A${statRowIndex}:H${statRowIndex}`);
        const statCell = sheet.getCell(`A${statRowIndex}`);
        statCell.value = `📊 إجمالي الإجازات: ${totalHolidays}   |   🌟 إجازات قادمة: ${upcomingHolidays}   |   🌍 إجازات عامة: ${generalHolidays}   |   🏢 خاصة بفروع: ${branchSpecificHolidays}`;
        statCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
        statCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        statCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } }; // Light Green Background
        statCell.border = {
            top: { style: 'medium', color: { argb: 'FF96CF75' } },
            bottom: { style: 'medium', color: { argb: 'FF96CF75' } },
            left: { style: 'medium', color: { argb: 'FF96CF75' } },
            right: { style: 'medium', color: { argb: 'FF96CF75' } }
        };
        sheet.getRow(statRowIndex).height = 30;

        // Row 8: Empty Spacer
        sheet.getRow(8).height = 10;

        // Set Headers
        const headers = ['اسم الإجازة', 'تاريخ البدء', 'تاريخ الانتهاء', 'الفرع', 'السنة الدراسية', 'الفصل الدراسي', 'ملاحظات', 'الحالة'];
        const headerRow = sheet.addRow(headers);
        headerRow.height = 30;

        headerRow.eachCell((cell) => {
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FF6B9B37' } // Brand Green
            };
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } }; // smaller font
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = {
                top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
            };
        });

        // Add Data
        holidays.forEach((h, index) => {
            let rowData = [
                h.name || '-',
                h.start_date || '-',
                h.end_date || '-',
                h.branch?.name || 'عام - جميع الفروع',
                h.academic_year?.name || '-',
                h.semester?.name || '-',
                h.notes || '-'
            ];

            // Calculate Status
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const start = new Date(h.start_date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(h.end_date);
            end.setHours(0, 0, 0, 0);

            let statusLabel = '';
            let statusColor = 'FF212529'; // Default dark gray
            let statusBg = null;

            if (today > end) {
                statusLabel = 'منتهية';
                statusColor = 'FF64748B'; // Slate
            } else if (today >= start && today <= end) {
                statusLabel = 'جارية الآن';
                statusColor = 'FF1D4ED8'; // Blue
                statusBg = 'FFDBEAFE'; // Light Blue
            } else {
                statusLabel = 'قادمة';
                statusColor = 'FF15803D'; // Green
            }

            rowData.push(statusLabel);

            const row = sheet.addRow(rowData);
            row.height = 35;
            
            row.eachCell((cell, colNumber) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, // Soft Gray Border
                    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
                };
                
                // Color status column (8th column)
                if (colNumber === 8) {
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: statusColor } };
                    if (statusBg) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
                    }
                }
            });
        });

        // Add Auto-filters
        sheet.autoFilter = `A9:H${holidays.length + 9}`;

        // Freeze panes
        sheet.views = [{ state: 'frozen', ySplit: 9, rightToLeft: true }];

        // Page settings
        sheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 }
        };

        // Footer settings
        sheet.headerFooter.oddFooter = '&L&10مدارس القيم الأهلية &C&10صفحة &P من &N &R&10تاريخ الطباعة: &D';

        // Protect Sheet
        await sheet.protect('SmartSchool123', {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: true,
            formatColumns: true,
            formatRows: true,
            sort: false,
            autoFilter: false,
        });

        // Download Excel
        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `سجل_الإجازات_والعطلات_${new Date().toISOString().split('T')[0]}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        });
    };

    // Time Status logic
    const getHolidayStatus = (startDate, endDate) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(0, 0, 0, 0);

        if (today > end) {
            return { label: 'منتهية', type: 'passed', color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', icon: CheckCircle2 };
        } else if (today >= start && today <= end) {
            return { label: 'جارية الآن', type: 'active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800', icon: Clock };
        } else {
            const diffTime = Math.abs(start - today);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return { label: `تبدأ بعد ${diffDays} يوم`, type: 'upcoming', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800', icon: AlertCircle };
        }
    };

    // KPI Calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const totalHolidays = holidays?.length || 0;
    const upcomingHolidays = holidays?.filter(h => new Date(h.start_date) > today && (new Date(h.start_date) - today) / (1000 * 60 * 60 * 24) <= 30).length || 0;
    const branchSpecificHolidays = holidays?.filter(h => h.branch_id).length || 0;
    const generalHolidays = totalHolidays - branchSpecificHolidays;

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedHolidays(holidays.map(h => h.id));
        } else {
            setSelectedHolidays([]);
        }
    };

    const handleSelectHoliday = (id) => {
        setSelectedHolidays(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleBulkDelete = () => {
        if (selectedHolidays.length === 0) return;
        if (confirm(`هل أنت متأكد من حذف ${selectedHolidays.length} إجازة؟`)) {
            router.post(route('hr.holidays.bulk-destroy'), { ids: selectedHolidays }, {
                onSuccess: () => setSelectedHolidays([]),
                preserveScroll: true
            });
        }
    };

    const applyAllFilters = () => {
        router.get(route('hr.holidays'), {
            search: searchTerm,
            academic_year_id: selectedYear,
            semester_id: selectedSemester,
            branch_id: selectedBranch,
            date_from: dateFrom,
            date_to: dateTo
        }, { preserveState: true, replace: true });
    };

    const resetFilters = () => {
        setSearchTerm('');
        setSelectedYear('');
        setSelectedSemester('');
        setSelectedBranch('');
        setDateFrom('');
        setDateTo('');
        router.get(route('hr.holidays'), {}, { preserveState: true, replace: true });
    };

    const applyFilter = (key, value) => {
        router.get(route('hr.holidays'), { ...filters, [key]: value }, { preserveState: true, replace: true });
    };

    const activeYear = academicYears?.find(ay => ay.is_active === 1 || ay.is_active === true) || academicYears?.[0];

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        name: '',
        start_date: '',
        end_date: '',
        branch_id: '',
        academic_year_id: activeYear ? activeYear.id : '',
        semester_id: '',
        notes: '',
    });

    const openModal = (holiday = null) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setData({
                name: holiday.name,
                start_date: holiday.start_date ? holiday.start_date.split('T')[0] : '',
                end_date: holiday.end_date ? holiday.end_date.split('T')[0] : '',
                branch_id: holiday.branch_id || '',
                academic_year_id: holiday.academic_year_id || '',
                semester_id: holiday.semester_id || '',
                notes: holiday.notes || '',
            });
        } else {
            setEditingHoliday(null);
            reset();
            setData('academic_year_id', activeYear ? activeYear.id : '');
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingHoliday(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingHoliday) {
            put(route('hr.holidays.update', editingHoliday.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.holidays.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (id) => {
        if (confirm('هل أنت متأكد من حذف هذه الإجازة الرسمية؟')) {
            destroy(route('hr.holidays.destroy', id));
        }
    };

    return (
        <AdminLayout>
            <Head title="الإجازات الرسمية والعطلات" />

            <div className="max-w-7xl mx-auto space-y-6">
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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-805 dark:text-white tracking-tight">الإجازات الرسمية والعطلات</h1>
                            <p className="text-primary-705/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة أيام العطل الرسمية للمؤسسة والفروع</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <div className="hidden sm:flex items-center p-1 bg-white/50 dark:bg-[#121820]/50 rounded-2xl border border-primary-100 dark:border-primary-500/20 backdrop-blur-sm">
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'table' ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                    title="عرض جدول"
                                >
                                    <List size={20} />
                                </button>
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-2 rounded-xl flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                    title="عرض بطاقات"
                                >
                                    <LayoutGrid size={20} />
                                </button>
                            </div>

                            <button
                                onClick={exportToExcel}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-sm font-bold transition-all"
                                title="تصدير إلى Excel"
                            >
                                <Download size={18} />
                                <span className="hidden md:inline">تصدير</span>
                            </button>

                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة إجازة رسمية</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center shrink-0">
                            <CalendarDays size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">إجمالي الإجازات</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{totalHolidays}</p>
                        </div>
                    </div>
                    <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                            <Clock size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">القادمة (خلال 30 يوم)</p>
                            <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{upcomingHolidays}</p>
                        </div>
                    </div>
                    <div className="bg-white/60 dark:bg-[#121820]/60 backdrop-blur-md border border-slate-100 dark:border-slate-800 rounded-3xl p-6 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Layers size={28} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">تخصيص الفروع</p>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xl font-black text-slate-800 dark:text-white">{branchSpecificHolidays}</span>
                                <span className="text-xs font-bold text-slate-400">خاصة</span>
                                <span className="text-slate-300">|</span>
                                <span className="text-xl font-black text-slate-800 dark:text-white">{generalHolidays}</span>
                                <span className="text-xs font-bold text-slate-400">عامة</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                {/* Filters */}
                <div className="bg-white dark:bg-[#121820]/60 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 mb-6 shadow-sm no-print">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <Search className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث عن إجازة..."
                                className="block w-full pr-11 pl-4 py-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm focus:ring-primary-500 focus:border-primary-500 transition-shadow dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyAllFilters()}
                            />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-bold transition-all flex-1 md:flex-none ${showFilters ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                            >
                                <Filter size={18} />
                                <span>تصفية متقدمة</span>
                                {showFilters ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                            <button
                                onClick={applyAllFilters}
                                className="flex items-center justify-center gap-2 px-5 py-3 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl text-sm font-bold transition-all"
                            >
                                <Search size={18} />
                                <span className="hidden sm:inline">بحث</span>
                            </button>
                        </div>
                    </div>

                    {/* Advanced Filters Panel */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-200">
                            {isAdmin && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الفرع</label>
                                    <SelectInput
                                        options={[
                                            { value: '', label: 'جميع الفروع' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ]}
                                        value={[
                                            { value: '', label: 'جميع الفروع' },
                                            ...branches.map(b => ({ value: b.id, label: b.name }))
                                        ].find(o => o.value == selectedBranch) || null}
                                        onChange={(selected) => setSelectedBranch(selected || '')}
                                        placeholder="اختر الفرع"
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">السنة الدراسية</label>
                                <SelectInput
                                    options={[
                                        { value: '', label: 'جميع السنوات' },
                                        ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                    ]}
                                    value={[
                                        { value: '', label: 'جميع السنوات' },
                                        ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                    ].find(o => o.value == selectedYear) || null}
                                    onChange={(selected) => {
                                        setSelectedYear(selected || '');
                                        setSelectedSemester('');
                                    }}
                                    placeholder="اختر السنة الدراسية"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">الفصل الدراسي</label>
                                <SelectInput
                                    options={[
                                        { value: '', label: 'جميع الفصول' },
                                        ...((academicYears?.find(ay => ay.id == selectedYear)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                    ]}
                                    value={[
                                        { value: '', label: 'جميع الفصول' },
                                        ...((academicYears?.find(ay => ay.id == selectedYear)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                    ].find(o => o.value == selectedSemester) || null}
                                    onChange={(selected) => setSelectedSemester(selected || '')}
                                    placeholder="اختر الفصل الدراسي"
                                    isDisabled={!selectedYear}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">من تاريخ</label>
                                <FlatpickrInput
                                    value={dateFrom}
                                    onChange={(dateStr) => setDateFrom(dateStr)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400"
                                    placeholder="تاريخ البدء"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">إلى تاريخ</label>
                                <FlatpickrInput
                                    value={dateTo}
                                    onChange={(dateStr) => setDateTo(dateStr)}
                                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-400"
                                    placeholder="تاريخ الانتهاء"
                                />
                            </div>

                            <div className="flex items-end lg:col-start-4">
                                <button
                                    onClick={resetFilters}
                                    className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400 rounded-xl text-sm font-bold transition-all"
                                >
                                    <RefreshCw size={16} />
                                    <span>إعادة ضبط</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* View Container */}
                {viewMode === 'table' ? (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">

                        {/* Bulk Actions Header */}
                        {selectedHolidays.length > 0 && (
                            <div className="bg-primary-50 dark:bg-primary-900/10 px-6 py-3 border-b border-primary-100 dark:border-primary-800 flex items-center justify-between animate-in slide-in-from-top-2">
                                <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                    تم تحديد {selectedHolidays.length} إجازة
                                </span>
                                <button
                                    onClick={handleBulkDelete}
                                    className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                                >
                                    <Trash2 size={16} />
                                    <span>حذف المحدد</span>
                                </button>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 w-12 text-center">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-slate-800 dark:border-slate-600"
                                                checked={selectedHolidays.length > 0 && selectedHolidays.length === holidays.length}
                                                onChange={handleSelectAll}
                                            />
                                        </th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">اسم الإجازة / المناسبة</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفترة</th>
                                        {isAdmin && <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفرع</th>}
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الفترة الأكاديمية</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">ملاحظات</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {holidays.length === 0 ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 8 : 7} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center space-y-4">
                                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                                                        <CalendarDays size={48} className="text-slate-300 dark:text-slate-600" />
                                                    </div>
                                                    <div className="text-center">
                                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">لم نتمكن من العثور على إجازات تطابق فلاتر البحث</h3>
                                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">حاول إزالة بعض الفلاتر لعرض نتائج أكثر.</p>
                                                    </div>
                                                    <button
                                                        onClick={resetFilters}
                                                        className="mt-2 px-5 py-2.5 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 font-bold rounded-xl transition-colors"
                                                    >
                                                        مسح الفلاتر
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        holidays.map((holiday) => {
                                            const status = getHolidayStatus(holiday.start_date, holiday.end_date);
                                            const StatusIcon = status.icon;
                                            return (
                                                <tr key={holiday.id} className={`transition-colors ${selectedHolidays.includes(holiday.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/20'}`}>
                                                    <td className="py-4 px-6 text-center">
                                                        <input
                                                            type="checkbox"
                                                            className="rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-slate-800 dark:border-slate-600"
                                                            checked={selectedHolidays.includes(holiday.id)}
                                                            onChange={() => handleSelectHoliday(holiday.id)}
                                                        />
                                                    </td>
                                                    <td className={`py-4 px-6 font-bold ${status.type === 'passed' ? 'text-slate-500 dark:text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                                                        {holiday.name}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${status.color}`}>
                                                            <StatusIcon size={14} />
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm whitespace-nowrap">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> {holiday.start_date ? holiday.start_date.split('T')[0] : ''}</span>
                                                            {holiday.start_date !== holiday.end_date && (
                                                                <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> {holiday.end_date ? holiday.end_date.split('T')[0] : ''}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    {isAdmin && (
                                                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                                                            {holiday.branch_id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center">
                                                                        <Building2 size={14} />
                                                                    </div>
                                                                    <span className="font-bold text-sm">{holiday.branch?.name}</span>
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                                                                    عام (لجميع الفروع)
                                                                </span>
                                                            )}
                                                        </td>
                                                    )}
                                                    <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                                        {holiday.academic_year ? holiday.academic_year.name : '-'}
                                                        {holiday.semester ? ` / ${holiday.semester.name}` : ''}
                                                    </td>
                                                    <td className="py-4 px-6 text-slate-500 text-sm max-w-xs truncate" title={holiday.notes}>
                                                        {holiday.notes || '-'}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center gap-2">
                                                            <button onClick={() => openModal(holiday)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 transition-colors">
                                                                <Edit2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleDelete(holiday.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-500/10 transition-colors">
                                                                <Trash2 size={16} />
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
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Bulk Actions Header for Grid */}
                        {selectedHolidays.length > 0 && (
                            <div className="bg-primary-50 dark:bg-primary-900/10 px-6 py-4 rounded-3xl border border-primary-100 dark:border-primary-800 flex items-center justify-between animate-in slide-in-from-top-2">
                                <span className="text-sm font-bold text-primary-700 dark:text-primary-300">
                                    تم تحديد {selectedHolidays.length} إجازة
                                </span>
                                <div className="flex items-center gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-600 dark:text-slate-400 font-bold">
                                        <input
                                            type="checkbox"
                                            className="rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-slate-800 dark:border-slate-600"
                                            checked={selectedHolidays.length > 0 && selectedHolidays.length === holidays.length}
                                            onChange={handleSelectAll}
                                        />
                                        تحديد الكل
                                    </label>
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-colors"
                                    >
                                        <Trash2 size={16} />
                                        <span>حذف المحدد</span>
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {holidays.length === 0 ? (
                                <div className="col-span-full py-16 text-center bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
                                    <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center">
                                        <CalendarDays size={48} className="text-slate-300 dark:text-slate-600" />
                                    </div>
                                    <div className="text-center">
                                        <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300">لم نتمكن من العثور على إجازات تطابق فلاتر البحث</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">حاول إزالة بعض الفلاتر لعرض نتائج أكثر.</p>
                                    </div>
                                    <button
                                        onClick={resetFilters}
                                        className="mt-2 px-5 py-2.5 bg-primary-50 text-primary-600 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:hover:bg-primary-500/20 font-bold rounded-xl transition-colors"
                                    >
                                        مسح الفلاتر
                                    </button>
                                </div>
                            ) : (
                                holidays.map((holiday) => {
                                    const status = getHolidayStatus(holiday.start_date, holiday.end_date);
                                    const StatusIcon = status.icon;
                                    const isSelected = selectedHolidays.includes(holiday.id);

                                    return (
                                        <div key={holiday.id} className={`group relative bg-white dark:bg-[#121820]/60 rounded-3xl border p-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full overflow-hidden ${isSelected ? 'border-primary-500 ring-1 ring-primary-500/50' : 'border-slate-100 dark:border-slate-800'}`}>
                                            <div className="absolute top-4 left-4 z-20">
                                                <input
                                                    type="checkbox"
                                                    className="w-5 h-5 rounded border-slate-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50 dark:bg-slate-800 dark:border-slate-600 cursor-pointer"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectHoliday(holiday.id)}
                                                />
                                            </div>
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-primary-500/10"></div>

                                            <div className="relative z-10 flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500">
                                                        <Calendar size={24} />
                                                    </div>
                                                    <div className="pl-6">
                                                        <h3 className="font-bold text-dark-900 dark:text-white text-lg leading-tight line-clamp-1" title={holiday.name}>{holiday.name}</h3>
                                                        <span className={`inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold ${status.color}`}>
                                                            <StatusIcon size={10} />
                                                            {status.label}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="relative z-10 space-y-2 mb-4 flex-1">
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                                        <GraduationCap size={14} />
                                                        {holiday.academic_year ? holiday.academic_year.name : '-'}
                                                        {holiday.semester ? ` / ${holiday.semester.name}` : ''}
                                                    </span>
                                                    {isAdmin && (
                                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                                            {holiday.branch_id ? holiday.branch?.name : 'عام'}
                                                        </span>
                                                    )}
                                                </div>

                                                {holiday.notes && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
                                                        {holiday.notes}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="relative z-10 flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-auto">
                                                <button onClick={() => openModal(holiday)} className="flex-1 flex justify-center items-center gap-2 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-500/10 transition-colors text-sm font-bold">
                                                    <Edit2 size={16} />
                                                    <span>تعديل</span>
                                                </button>
                                                <button onClick={() => handleDelete(holiday.id)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                )}

                        {/* Modal */}
                        {isModalOpen && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
                                <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">

                                    {/* Modal Header */}
                                    <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                                    <Calendar size={24} />
                                                </div>
                                                <div>
                                                    <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                                        {editingHoliday ? 'تعديل الإجازة الرسمية' : 'إضافة إجازة رسمية جديدة'}
                                                    </h3>
                                                    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                                        {editingHoliday ? 'تحديث بيانات الإجازة المحددة' : 'أدخل تفاصيل الإجازة الجديدة ليتم إضافتها للنظام'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={closeModal}
                                                className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center justify-center transition-colors shrink-0"
                                            >
                                                <X size={20} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Modal Body */}
                                    <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                                        <form onSubmit={submit} className="space-y-6" id="holidayForm">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                    <FileText size={16} className="text-primary-500" />
                                                    اسم المناسبة / الإجازة <span className="text-accent-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                        value={data.name}
                                                        onChange={e => setData('name', e.target.value)}
                                                        placeholder="مثال: عيد الفطر المبارك، اليوم الوطني..."
                                                    />
                                                </div>
                                                {errors.name && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12} /> {errors.name}</p>}
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                        <CalendarDays size={16} className="text-primary-500" />
                                                        تاريخ البدء <span className="text-accent-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <FlatpickrInput
                                                            value={data.start_date}
                                                            onChange={(dateStr) => setData('start_date', dateStr)}
                                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                        />
                                                    </div>
                                                    {errors.start_date && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12} /> {errors.start_date}</p>}
                                                </div>
                                                <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                        <CalendarDays size={16} className="text-primary-500" />
                                                        تاريخ الانتهاء <span className="text-accent-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <FlatpickrInput
                                                            value={data.end_date}
                                                            onChange={(dateStr) => setData('end_date', dateStr)}
                                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                                        />
                                                    </div>
                                                    {errors.end_date && <p className="text-xs text-accent-500 mt-2 flex items-center gap-1"><X size={12} /> {errors.end_date}</p>}
                                                </div>
                                            </div>

                                            {(isAdmin || academicYears?.length > 0) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                    {isAdmin && (
                                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 h-full transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                                <MapPin size={16} className="text-primary-500" />
                                                                الفرع المخصص
                                                            </label>
                                                            <SelectInput
                                                                options={[
                                                                    { value: '', label: 'عام - لجميع الفروع' },
                                                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                                                ]}
                                                                value={[
                                                                    { value: '', label: 'عام - لجميع الفروع' },
                                                                    ...branches.map(b => ({ value: b.id, label: b.name }))
                                                                ].find(o => o.value == data.branch_id) || null}
                                                                onChange={(selected) => setData('branch_id', selected || '')}
                                                            />
                                                            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 w-fit px-2 py-1 rounded-md"><Building2 size={12} /> اتركه فارغاً ليطبق على الجميع.</p>
                                                        </div>
                                                    )}

                                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 h-full flex flex-col justify-between transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                            <GraduationCap size={16} className="text-primary-500" />
                                                            الفترة الأكاديمية
                                                        </label>
                                                        <div className="space-y-4 mt-1">
                                                            <div className="relative">
                                                                <SelectInput
                                                                    options={[
                                                                        { value: '', label: 'سنة دراسية (غير محدد)' },
                                                                        ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                                                    ]}
                                                                    value={[
                                                                        { value: '', label: 'سنة دراسية (غير محدد)' },
                                                                        ...(academicYears?.map(ay => ({ value: ay.id, label: ay.name })) || [])
                                                                    ].find(o => o.value == data.academic_year_id) || null}
                                                                    onChange={(selected) => {
                                                                        setData({
                                                                            ...data,
                                                                            academic_year_id: selected || '',
                                                                            semester_id: ''
                                                                        });
                                                                    }}
                                                                    placeholder="اختر السنة الدراسية"
                                                                />
                                                            </div>
                                                            <div className="relative">
                                                                <SelectInput
                                                                    options={[
                                                                        { value: '', label: 'فصل دراسي (غير محدد)' },
                                                                        ...((academicYears?.find(ay => ay.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                                                    ]}
                                                                    value={[
                                                                        { value: '', label: 'فصل دراسي (غير محدد)' },
                                                                        ...((academicYears?.find(ay => ay.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name })))
                                                                    ].find(o => o.value == data.semester_id) || null}
                                                                    onChange={(selected) => setData('semester_id', selected || '')}
                                                                    isDisabled={!data.academic_year_id}
                                                                    placeholder="اختر الفصل الدراسي"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                                <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-2">
                                                    <AlignLeft size={16} className="text-primary-500" />
                                                    ملاحظات إضافية (اختياري)
                                                </label>
                                                <div className="relative mt-1">
                                                    <textarea
                                                        rows="3"
                                                        className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm resize-none"
                                                        value={data.notes}
                                                        onChange={e => setData('notes', e.target.value)}
                                                        placeholder="اكتب أي ملاحظات إضافية هنا..."
                                                    ></textarea>
                                                </div>
                                            </div>
                                        </form>
                                    </div>

                                    {/* Modal Footer */}
                                    <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                                        <button
                                            type="submit"
                                            form="holidayForm"
                                            disabled={processing}
                                            className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                                        >
                                            <Save size={20} />
                                            {editingHoliday ? 'حفظ التعديلات' : 'إضافة الإجازة'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="sm:w-1/3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold transition-all active:scale-[0.98]"
                                        >
                                            إلغاء
                                        </button>
                                    </div>

                                </div>
                            </div>
                        )}
                    </div>
        </AdminLayout>
    );
}

