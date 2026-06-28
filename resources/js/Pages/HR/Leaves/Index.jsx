import React, { useState } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import FlatpickrInput from '@/Components/FlatpickrInput';
import { Calendar, Plus, Edit2, Trash2, X, Save, Clock, CheckCircle, XCircle, Eye, AlertCircle, FileText, User, Tag, ShieldAlert, FolderOpen, Filter, CheckCircle2, AlignLeft, LayoutGrid, Table2, MoreVertical, RotateCcw, Download } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import InputLabel from '@/Components/InputLabel';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';

export default function LeavesIndex({ leaves, employees, academicYears = [], leaveTypes = [], isAdmin, filters = {} }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingLeave, setEditingLeave] = useState(null);
    const [viewingLeave, setViewingLeave] = useState(null);
    const [leaveToDelete, setLeaveToDelete] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        employee_id: '',
        academic_year_id: '',
        semester_id: '',
        leave_type_id: '',
        start_date: '',
        end_date: '',
        status: 'pending',
        reason: '',
    });

    const openModal = (leave = null) => {
        if (leave) {
            setEditingLeave(leave);
            setData({
                employee_id: leave.employee_id,
                academic_year_id: leave.academic_year_id || '',
                semester_id: leave.semester_id || '',
                leave_type_id: leave.leave_type_id,
                start_date: leave.start_date,
                end_date: leave.end_date,
                status: leave.status,
                reason: leave.reason || '',
            });
        } else {
            setEditingLeave(null);
            reset();
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingLeave(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingLeave) {
            put(route('hr.leaves.update', editingLeave.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('hr.leaves.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (leave) => {
        setLeaveToDelete(leave);
        setIsDeleteModalOpen(true);
    };

    const deleteLeave = () => {
        destroy(route('hr.leaves.destroy', leaveToDelete.id), {
            onSuccess: () => {
                setIsDeleteModalOpen(false);
                setLeaveToDelete(null);
            }
        });
    };

    const [filterData, setFilterData] = useState({
        employee_id: filters.employee_id || '',
        leave_type_id: filters.leave_type_id || '',
        status: filters.status || '',
        academic_year_id: filters.academic_year_id || '',
        semester_id: filters.semester_id || '',
        start_date: filters.start_date || '',
        end_date: filters.end_date || '',
    });

    const applyFilters = () => {
        router.get(route('hr.leaves'), filterData, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setFilterData({
            employee_id: '',
            leave_type_id: '',
            status: '',
            academic_year_id: '',
            semester_id: '',
            start_date: '',
            end_date: ''
        });
        router.get(route('hr.leaves'), {
            employee_id: '',
            leave_type_id: '',
            status: '',
            academic_year_id: '',
            semester_id: '',
            start_date: '',
            end_date: ''
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const stats = {
        total: leaves.length,
        approved: leaves.filter(l => l.status === 'approved').length,
        pending: leaves.filter(l => l.status === 'pending').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
    };

    const StatusBadge = ({ status }) => {
        switch (status) {
            case 'approved': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"><CheckCircle size={14}/> موافق عليها</span>;
            case 'rejected': return <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-rose-900/30 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"><XCircle size={14}/> مرفوضة</span>;
            default: return <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-bold flex items-center gap-1 w-max dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"><Clock size={14}/> قيد الانتظار</span>;
        }
    }

    const { props } = usePage();
    const logo_url = props.app?.logo_url || null;

    const exportToExcel = async () => {
        const recordsToExport = leaves || [];
        if (recordsToExport.length === 0) {
            Swal.fire({ title: 'لا يوجد بيانات', text: 'لا يوجد سجلات لتصديرها', icon: 'info' });
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('سجل الإجازات', { views: [{ rightToLeft: true }] });

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

        const columns = [
            { header: 'الموظف', key: 'employee', width: 35 },
            { header: 'القسم', key: 'department', width: 20 },
            { header: 'نوع الإجازة', key: 'leave_type', width: 20 },
            { header: 'تاريخ البداية', key: 'start_date', width: 15 },
            { header: 'تاريخ النهاية', key: 'end_date', width: 15 },
            { header: 'مدة الإجازة (أيام)', key: 'duration', width: 15 },
            { header: 'السنة الدراسية', key: 'academic_year', width: 20 },
            { header: 'الفصل الدراسي', key: 'semester', width: 20 },
            { header: 'حالة الطلب', key: 'status', width: 15 },
            { header: 'البيان/السبب', key: 'reason', width: 35 }
        ];

        if (logoId !== null) {
            sheet.addImage(logoId, { tl: { col: 4.8, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        const lastColLetter = 'J';
        sheet.getRow(1).height = 10;
        sheet.mergeCells(`A1:${lastColLetter}1`);
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

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
        subTitleCell.value = 'النظام الإداري - سجل الإجازات';
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells(`H2:J2`);
        const typeCell = sheet.getCell(`H2`);
        typeCell.value = 'نوع التقرير: سجل الإجازات';
        typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const printDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells(`H3:J3`);
        const dateCell = sheet.getCell(`H3`);
        dateCell.value = `تاريخ التصدير: ${printDate}`;
        dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.getRow(5).height = 15;

        sheet.mergeCells(`A6:J6`);
        const statCell = sheet.getCell(`A6`);
        statCell.value = `📊 إجمالي الطلبات: ${stats.total}   |   ✅ موافق عليها: ${stats.approved}   |   ⚠️ قيد الانتظار: ${stats.pending}   |   ❌ مرفوضة: ${stats.rejected}`;
        statCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
        statCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        statCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } }; 
        statCell.border = { top: { style: 'medium', color: { argb: 'FF96CF75' } }, bottom: { style: 'medium', color: { argb: 'FF96CF75' } }, left: { style: 'medium', color: { argb: 'FF96CF75' } }, right: { style: 'medium', color: { argb: 'FF96CF75' } } };
        sheet.getRow(6).height = 30;

        sheet.getRow(7).height = 10;

        sheet.columns = columns;
        const headerRow = sheet.getRow(8);
        headerRow.values = columns.map(c => c.header);
        headerRow.height = 30;

        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
        });

        recordsToExport.forEach((r) => {
            const startD = new Date(r.start_date);
            const endD = new Date(r.end_date);
            const diffTime = Math.abs(endD - startD);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            let statusLabel = 'غير محدد';
            if(r.status === 'approved') statusLabel = 'موافق عليها';
            else if(r.status === 'rejected') statusLabel = 'مرفوضة';
            else if(r.status === 'pending') statusLabel = 'قيد الانتظار';

            const rowData = {
                employee: r.employee?.user?.name || "",
                department: r.employee?.department?.name || "",
                leave_type: r.leave_type?.name || r.leaveType?.name || "",
                start_date: r.start_date,
                end_date: r.end_date,
                duration: diffDays,
                academic_year: r.academic_year?.name || r.academicYear?.name || "",
                semester: r.semester?.name || "",
                status: statusLabel,
                reason: r.reason || ""
            };

            const row = sheet.addRow(rowData);
            row.height = 35;
            
            row.eachCell((cell, colNumber) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                cell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                
                if (colNumber === 9) {
                    if (r.status === 'approved') {
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF15803D' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } };
                    } else if (r.status === 'pending') {
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFB45309' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFBEB' } };
                    } else if (r.status === 'rejected') {
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFB91C1C' } };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
                    }
                }

                if (colNumber === 6) {
                    cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF2563EB' } };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF6FF' } };
                }
            });
            row.height = 25;
        });

        sheet.autoFilter = `A8:${lastColLetter}${recordsToExport.length + 8}`;
        sheet.views = [{ state: 'frozen', ySplit: 8, rightToLeft: true }];
        sheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 } };
        sheet.headerFooter.oddFooter = '&L&10مدارس القيم الأهلية &C&10صفحة &P من &N &R&10تاريخ الطباعة: &D';

        // Summary Sheet
        const sumSheet = workbook.addWorksheet('ملخص وإحصائيات الإجازات', { views: [{ rightToLeft: true }] });
        
        sumSheet.columns = [
            { header: 'الموظف', key: 'employee', width: 35 },
            { header: 'القسم', key: 'department', width: 25 },
            { header: 'إجمالي الطلبات', key: 'total', width: 15 },
            { header: 'موافق عليها (أيام)', key: 'approved_days', width: 20 },
            { header: 'مرفوضة (طلبات)', key: 'rejected', width: 15 },
            { header: 'قيد الانتظار (طلبات)', key: 'pending', width: 15 },
        ];

        const sumHeaderRow = sumSheet.getRow(1);
        sumHeaderRow.values = sumSheet.columns.map(c => c.header);
        sumHeaderRow.height = 30;
        sumHeaderRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
            cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        const empSummary = {};
        recordsToExport.forEach(r => {
            const empName = r.employee?.user?.name || 'غير معروف';
            if (!empSummary[empName]) {
                empSummary[empName] = {
                    dept: r.employee?.department?.name || '',
                    total: 0,
                    approved_days: 0,
                    rejected: 0,
                    pending: 0
                };
            }
            
            const startD = new Date(r.start_date);
            const endD = new Date(r.end_date);
            const diffTime = Math.abs(endD - startD);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

            empSummary[empName].total++;
            if (r.status === 'approved') empSummary[empName].approved_days += diffDays;
            else if (r.status === 'rejected') empSummary[empName].rejected++;
            else if (r.status === 'pending') empSummary[empName].pending++;
        });

        Object.keys(empSummary).forEach(emp => {
            const data = empSummary[emp];
            const row = sumSheet.addRow({
                employee: emp,
                department: data.dept,
                total: data.total,
                approved_days: data.approved_days,
                rejected: data.rejected,
                pending: data.pending
            });
            row.eachCell((cell, colNum) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.font = { name: 'Segoe UI', size: 11 };
                if (colNum === 4 && data.approved_days > 0) cell.font = { ...cell.font, color: { argb: 'FF15803D' }, bold: true };
                if (colNum === 5 && data.rejected > 0) cell.font = { ...cell.font, color: { argb: 'FFDC2626' }, bold: true };
                if (colNum === 6 && data.pending > 0) cell.font = { ...cell.font, color: { argb: 'FFB45309' }, bold: true };
            });
            row.height = 25;
        });

        sumSheet.autoFilter = `A1:F${Object.keys(empSummary).length + 1}`;
        sumSheet.pageSetup = { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 } };

        await sheet.protect('SmartSchool123', {
            selectLockedCells: true, selectUnlockedCells: true, formatColumns: true, formatRows: true, sort: true, autoFilter: true
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `سجل_الإجازات.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <AdminLayout>
            <Head title="إجازات الموظفين" />

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
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
                                <Clock size={28} className="text-primary-600" />
                                إجازات الموظفين
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">إدارة الأرصدة والطلبات والإجازات الممنوحة للموظفين بشكل احترافي</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={exportToExcel}
                                className="flex items-center justify-center p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#121820] text-slate-550 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50 hover:border-primary-300 shadow-sm transition-all"
                                title="تصدير كملف Excel">
                                <Download size={18} />
                            </button>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>إضافة إجازة لموظف</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
                            <FileText className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي الطلبات</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="text-emerald-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">الموافق عليها</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.approved}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0">
                            <Clock className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">قيد الانتظار</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.pending}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-5 md:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-all hover:shadow-md hover:-translate-y-1">
                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center shrink-0">
                            <XCircle className="text-rose-500" size={24} />
                        </div>
                        <div>
                            <p className="text-xs md:text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">المرفوضة</p>
                            <h4 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.rejected}</h4>
                        </div>
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                    
                    <div className="flex items-center gap-2 mb-4">
                        <Filter size={18} className="text-primary-500" />
                        <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Employee Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="الموظف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.employee_id} 
                                onChange={val => setFilterData({...filterData, employee_id: val})}
                                options={[
                                    { value: '', label: 'جميع الموظفين' },
                                    ...employees.map(emp => ({ value: emp.id, label: `${emp.first_name} ${emp.last_name}` }))
                                ]}
                            />
                        </div>
                        
                        {/* Leave Type Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="نوع الإجازة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.leave_type_id} 
                                onChange={val => setFilterData({...filterData, leave_type_id: val})}
                                options={[
                                    { value: '', label: 'جميع أنواع الإجازات' },
                                    ...leaveTypes.map(t => ({ value: t.id, label: t.name }))
                                ]}
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="حالة الطلب" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.status} 
                                onChange={val => setFilterData({...filterData, status: val})}
                                options={[
                                    { value: '', label: 'جميع الحالات' },
                                    { value: 'pending', label: 'قيد الانتظار' },
                                    { value: 'approved', label: 'موافق عليها' },
                                    { value: 'rejected', label: 'مرفوضة' }
                                ]}
                            />
                        </div>

                        {/* Academic Year Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="السنة الدراسية" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.academic_year_id} 
                                onChange={val => setFilterData({...filterData, academic_year_id: val, semester_id: ''})}
                                options={[
                                    { value: '', label: 'جميع السنوات الدراسية' },
                                    ...academicYears.map(y => ({ value: y.id, label: y.name }))
                                ]}
                            />
                        </div>

                        {/* Semester Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="الفصل الدراسي" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <SelectInput 
                                className="w-full" 
                                value={filterData.semester_id} 
                                onChange={val => setFilterData({...filterData, semester_id: val})}
                                options={[
                                    { value: '', label: 'جميع الفصول الدراسية' },
                                    ...(academicYears.find(y => y.id == filterData.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name }))
                                ]}
                                disabled={!filterData.academic_year_id}
                            />
                        </div>

                        {/* Date From Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="من تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.start_date}
                                onChange={val => setFilterData({...filterData, start_date: val})}
                                placeholder="اختر البداية..."
                            />
                        </div>

                        {/* Date To Filter */}
                        <div className="group flex flex-col">
                            <InputLabel value="إلى تاريخ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                            <FlatpickrInput 
                                type="date"
                                className="w-full bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 rounded-xl py-2.5 transition-all hover:bg-slate-100 dark:hover:bg-slate-800/80 !pl-10"
                                value={filterData.end_date}
                                onChange={val => setFilterData({...filterData, end_date: val})}
                                placeholder="اختر النهاية..."
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-3 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80">
                        <button 
                            onClick={applyFilters} 
                            className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow-md hover:shadow-primary-500/20 text-sm"
                        >
                            <Filter size={16} />
                            تطبيق الفرز
                        </button>
                        {(filterData.employee_id || filterData.leave_type_id || filterData.status || filterData.academic_year_id || filterData.semester_id || filterData.start_date || filterData.end_date) && (
                            <button 
                                onClick={clearFilters} 
                                className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold flex items-center gap-2 transition-all text-sm"
                            >
                                <RotateCcw size={16} />
                                إعادة ضبط
                            </button>
                        )}
                    </div>
                </div>

                {/* Content */}
                {leaves.length === 0 ? (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm py-16 text-center">
                        <div className="flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 text-primary-400 dark:text-primary-500 rounded-full flex items-center justify-center mb-4">
                                <FolderOpen size={48} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">لا توجد إجازات حالياً</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm">لم يتم تسجيل أي إجازات للموظفين بناءً على الفلاتر المحددة. يمكنك إضافة إجازة جديدة من الزر بالأعلى.</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-right min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الموظف</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">نوع الإجازة</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">المدة والتاريخ</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">السبب/البيان</th>
                                        <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">الحالة</th>
                                        <th className="py-4 px-6 text-center text-sm font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider w-32">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {leaves.map((leave) => (
                                        <tr key={leave.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 ring-2 ring-white dark:ring-[#121820] flex items-center justify-center font-bold text-sm shadow-sm">
                                                        {leave.employee?.user?.name ? leave.employee.user.name.charAt(0) : '?'}
                                                    </div>
                                                    <div>
                                                        <span className="block font-black text-slate-800 dark:text-white text-sm">{leave.employee?.user?.name || '-'}</span>
                                                        <span className="block text-xs font-semibold text-slate-500">{leave.employee?.job_title || 'موظف'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100/50 dark:border-transparent">
                                                    <Tag size={13} />
                                                    {leave.leave_type?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-600 dark:text-slate-300 text-sm">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar size={13} className="text-primary-500 shrink-0" />
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">
                                                            {new Date(leave.start_date).toLocaleDateString('ar-SA')}
                                                            <span className="mx-1 text-slate-400 font-normal">إلى</span>
                                                            {new Date(leave.end_date).toLocaleDateString('ar-SA')}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                                                        <Clock size={12} /> 
                                                        المدة: {Math.ceil((new Date(leave.end_date) - new Date(leave.start_date)) / (1000 * 60 * 60 * 24)) + 1} أيام
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-500 text-sm max-w-[150px] truncate font-medium">
                                                {leave.reason || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <StatusBadge status={leave.status} />
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => setViewingLeave(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all shadow-sm" title="عرض التفاصيل">
                                                        <Eye size={15} />
                                                    </button>
                                                    {leave.status !== 'approved' ? (
                                                        <>
                                                            <button onClick={() => openModal(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 transition-all shadow-sm" title="تعديل">
                                                                <Edit2 size={15} />
                                                            </button>
                                                            <button onClick={() => confirmDelete(leave)} className="p-2 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm" title="حذف">
                                                                <Trash2 size={15} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className="p-2 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50 shadow-sm" title="مقفلة">
                                                            <CheckCircle size={15} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={closeModal}></div>
                        <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
                            
                            <div className="relative p-6 sm:p-8 pb-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-500 to-primary-600"></div>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-500 shrink-0">
                                            <Calendar size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl sm:text-2xl font-black text-dark-900 dark:text-white tracking-tight">
                                                {editingLeave ? 'تعديل إجازة الموظف' : 'تسجيل إجازة جديدة لموظف'}
                                            </h3>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold mt-1">
                                                {editingLeave ? 'تحديث بيانات الإجازة المحددة' : 'أدخل تفاصيل ونوع وتواريخ الإجازة لاعتمادها في النظام'}
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

                            <div className="p-6 sm:p-8 overflow-y-auto custom-scrollbar flex-1">
                                <form onSubmit={submit} className="space-y-6" id="leaveForm">
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                            <User size={16} className="text-primary-500" />
                                            الموظف <span className="text-rose-500">*</span>
                                        </label>
                                        <SelectInput
                                            className="w-full"
                                            options={employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
                                            value={data.employee_id}
                                            onChange={(selected) => setData('employee_id', selected || '')}
                                            placeholder="ابحث عن الموظف..."
                                        />
                                        {errors.employee_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.employee_id}</p>}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                السنة الدراسية
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={academicYears.map(y => ({ value: y.id, label: y.name }))}
                                                value={data.academic_year_id}
                                                onChange={(val) => {
                                                    setData(prev => ({ ...prev, academic_year_id: val || '', semester_id: '' }));
                                                }}
                                                placeholder="اختر السنة الدراسية"
                                            />
                                            {errors.academic_year_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.academic_year_id}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <FileText size={16} className="text-primary-500" />
                                                الفصل الدراسي
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={(academicYears.find(y => y.id == data.academic_year_id)?.semesters || []).map(s => ({ value: s.id, label: s.name }))}
                                                value={data.semester_id}
                                                onChange={(val) => setData('semester_id', val || '')}
                                                placeholder="اختر الفصل الدراسي"
                                                disabled={!data.academic_year_id}
                                            />
                                            {errors.semester_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.semester_id}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Tag size={16} className="text-primary-500" />
                                                نوع الإجازة <span className="text-rose-500">*</span>
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={leaveTypes.map(t => ({ value: t.id, label: t.name }))}
                                                value={data.leave_type_id}
                                                onChange={(val) => setData('leave_type_id', val || '')}
                                                placeholder="اختر النوع"
                                            />
                                            {errors.leave_type_id && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.leave_type_id}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <AlertCircle size={16} className="text-primary-500" />
                                                حالة الطلب <span className="text-rose-500">*</span>
                                            </label>
                                            <SelectInput
                                                className="w-full"
                                                options={[
                                                    {value: 'pending', label: 'قيد الانتظار'},
                                                    {value: 'approved', label: 'مقبول'},
                                                    {value: 'rejected', label: 'مرفوض'}
                                                ]}
                                                value={data.status}
                                                onChange={(selected) => setData('status', selected || '')}
                                                placeholder="اختر الحالة"
                                            />
                                            {errors.status && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.status}</p>}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                تاريخ البدء <span className="text-rose-500">*</span>
                                            </label>
                                            <FlatpickrInput
                                                value={data.start_date}
                                                onChange={(dateStr) => setData('start_date', dateStr)}
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            />
                                            {errors.start_date && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.start_date}</p>}
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                            <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                                <Calendar size={16} className="text-primary-500" />
                                                تاريخ الانتهاء <span className="text-rose-500">*</span>
                                            </label>
                                            <FlatpickrInput
                                                value={data.end_date}
                                                onChange={(dateStr) => setData('end_date', dateStr)}
                                                className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            />
                                            {errors.end_date && <p className="text-xs text-rose-500 mt-2 flex items-center gap-1"><X size={12}/> {errors.end_date}</p>}
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/60 transition-colors focus-within:bg-white dark:focus-within:bg-slate-800/60">
                                        <label className="flex items-center gap-2 text-sm font-bold text-dark-900 dark:text-white mb-3">
                                            <AlignLeft size={16} className="text-primary-500" />
                                            ملاحظات / السبب (اختياري)
                                        </label>
                                        <textarea
                                            rows="3"
                                            className="w-full bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm outline-none transition-all focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 shadow-sm"
                                            value={data.reason} 
                                            onChange={e => setData('reason', e.target.value)}
                                            placeholder="اكتب سبب طلب الإجازة هنا..."
                                        ></textarea>
                                    </div>
                                </form>
                            </div>
                            
                            {/* Modal Footer */}
                            <div className="p-6 sm:p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="submit"
                                    form="leaveForm"
                                    disabled={processing}
                                    className="flex-1 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30 active:scale-[0.98]"
                                >
                                    <Save size={20} />
                                    {editingLeave ? 'حفظ التعديلات' : 'إضافة الإجازة'}
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

                {/* View Details Clean UI/UX Modal */}
                {viewingLeave && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setViewingLeave(null)}></div>
                        
                        <div className="relative bg-white dark:bg-[#121820] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
                            
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-600 dark:text-primary-400">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight">تفاصيل الإجازة</h3>
                                        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono mt-0.5">REF: L-{viewingLeave.id.toString().padStart(5, '0')}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => window.print()} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="طباعة">
                                        <FileText size={20} />
                                    </button>
                                    <button onClick={() => setViewingLeave(null)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="إغلاق">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 sm:p-8 flex-1 overflow-y-auto custom-scrollbar">
                                <div className="space-y-8">
                                    
                                    {/* Employee Profile & Status */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700/60 rounded-2xl p-5 shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300 ring-4 ring-slate-50 dark:ring-slate-800/50">
                                                {viewingLeave.employee?.user?.name ? viewingLeave.employee.user.name.charAt(0) : '?'}
                                            </div>
                                            <div>
                                                <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{viewingLeave.employee?.user?.name || '-'}</h4>
                                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <span>{viewingLeave.employee?.job_title || 'موظف'}</span>
                                                    {viewingLeave.employee?.job_grade && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                            <span className="font-semibold">{viewingLeave.employee.job_grade.name}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0">
                                            <StatusBadge status={viewingLeave.status} />
                                        </div>
                                    </div>

                                    {/* Leave Info Grid */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <AlertCircle size={16} className="text-primary-500" />
                                            بيانات الطلب
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">نوع الإجازة</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Tag size={14} className="text-primary-500" />
                                                    {viewingLeave.leave_type?.name || '-'}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">المدة</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Clock size={14} className="text-primary-500" />
                                                    {Math.ceil((new Date(viewingLeave.end_date) - new Date(viewingLeave.start_date)) / (1000 * 60 * 60 * 24)) + 1} أيام
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">تاريخ البدء</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {new Date(viewingLeave.start_date).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-100 dark:border-slate-700/50">
                                                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">تاريخ الانتهاء</span>
                                                <span className="block text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                                                    <Calendar size={14} className="text-primary-500" />
                                                    {new Date(viewingLeave.end_date).toLocaleDateString('ar-SA')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Reason */}
                                    {viewingLeave.reason && (
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                                <AlignLeft size={16} className="text-primary-500" />
                                                الملاحظات والسبب
                                            </h4>
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border-r-4 border-r-primary-500 border border-slate-100 dark:border-slate-700/50 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                                                {viewingLeave.reason}
                                            </div>
                                        </div>
                                    )}

                                    {/* Workflow & Signatures */}
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                            <ShieldAlert size={16} className="text-primary-500" />
                                            الاعتماد والتوثيق
                                        </h4>
                                        
                                        {viewingLeave.related_request ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {/* Employee */}
                                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex flex-col justify-between">
                                                    <div className="flex items-center gap-2 mb-4 text-slate-500 dark:text-slate-400">
                                                        <User size={16} />
                                                        <span className="text-xs font-bold uppercase tracking-wider">توقيع مقدم الطلب</span>
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center min-h-[60px]">
                                                        {viewingLeave.related_request.employee_signature_url ? (
                                                            <img src={viewingLeave.related_request.employee_signature_url} className="max-h-12 object-contain opacity-70 mix-blend-multiply dark:mix-blend-normal" alt="توقيع الموظف" />
                                                        ) : (
                                                            <span className="text-xs text-slate-400 font-medium bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700">غير متوفر</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Manager */}
                                                <div className="border border-emerald-200 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                                                            <CheckCircle2 size={16} />
                                                            <span className="text-xs font-bold uppercase tracking-wider">اعتماد الإدارة</span>
                                                        </div>
                                                        {viewingLeave.related_request.reviewed_at && (
                                                            <span className="text-[10px] font-bold text-slate-400 font-mono">
                                                                {new Date(viewingLeave.related_request.reviewed_at).toLocaleDateString('ar-SA')}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 flex items-center justify-center min-h-[60px]">
                                                        {viewingLeave.related_request.manager_signature_url ? (
                                                            <div className="text-center">
                                                                <img src={viewingLeave.related_request.manager_signature_url} className="max-h-12 mx-auto object-contain opacity-70 mix-blend-multiply dark:mix-blend-normal mb-1" alt="توقيع المدير" />
                                                                <span className="text-[10px] text-emerald-600/80 font-medium">{viewingLeave.related_request.manager?.name}</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-500 font-bold text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                                                                <CheckCircle size={16} />
                                                                معتمد إلكترونياً
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-5 border border-slate-100 dark:border-slate-700/50 flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 shrink-0 shadow-sm border border-slate-100 dark:border-slate-600">
                                                    <AlertCircle size={20} />
                                                </div>
                                                <div>
                                                    <h5 className="font-bold text-slate-700 dark:text-slate-300 text-sm">مسجلة بواسطة الإدارة</h5>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">تم إضافة هذه الإجازة مباشرة للموظف، ولا يوجد طلب أو توقيع مرتبط بها.</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
                                <button
                                    onClick={() => setViewingLeave(null)}
                                    className="px-6 py-2.5 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-all active:scale-[0.98] text-sm shadow-sm"
                                >
                                    إغلاق
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {isDeleteModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity" onClick={() => setIsDeleteModalOpen(false)}></div>
                        <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col">
                            <div className="p-8 text-center flex-1">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-dark-900 dark:text-white mb-3">تأكيد الحذف</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed">
                                    هل أنت متأكد من رغبتك في حذف إجازة الموظف المحددة؟ 
                                    <br/>سيتم إرجاع الأرصدة المستقطعة للموظف ولا يمكن التراجع عن هذا الإجراء.
                                </p>
                            </div>
                            <div className="p-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={deleteLeave}
                                    className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3.5 rounded-xl font-bold transition-all shadow-md shadow-rose-500/20 hover:shadow-lg hover:shadow-rose-500/30 active:scale-[0.98] flex items-center justify-center gap-2"
                                >
                                    نعم، احذف الإجازة
                                </button>
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
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
