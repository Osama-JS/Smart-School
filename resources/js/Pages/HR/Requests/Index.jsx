import React, { useState, useRef } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import SignaturePad from '@/Components/SignaturePad';
import {
    FileText, Clock, CheckCircle, XCircle, Users, Filter, Eye,
    X, PenLine, ChevronDown, Umbrella, LogOut, CreditCard, Wrench, Package, Award,
    User, Briefcase, Calendar, Info, CheckSquare, List, MessageSquare, ClipboardList, PenTool, Hash, ShieldCheck, FileEdit, Download
} from 'lucide-react';
import ExcelJS from 'exceljs';

const TYPE_ICONS = {
    leave:       Umbrella,
    permission:  LogOut,
    loan:        CreditCard,
    maintenance: Wrench,
    supplies:    Package,
    certificate: Award,
};

const STATUS_COLORS = {
    pending:  { bg: 'bg-amber-50 dark:bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',   border: 'border-amber-200 dark:border-amber-500/30' },
    approved: { bg: 'bg-emerald-50 dark:bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-500/30' },
    rejected: { bg: 'bg-red-50 dark:bg-red-500/10',       text: 'text-red-600 dark:text-red-400',       border: 'border-red-200 dark:border-red-500/30' },
};

export default function RequestsIndex({ requests, stats, types, statuses, filters, leaveBalances }) {
    const { flash, logo_url } = usePage().props;
    const [reviewingRequest, setReviewingRequest] = useState(null);
    const [viewingRequest, setViewingRequest] = useState(null);
    const [signatureData, setSignatureData] = useState(null);
    const [expandedId, setExpandedId] = useState(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        status: '',
        manager_notes: '',
        manager_signature: '',
        updated_details: {},
    });

    const exportToExcel = async () => {
        if (!requests.data || requests.data.length === 0) {
            alert('لا يوجد طلبات لتصديرها');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('طلبات الموظفين', { views: [{ rightToLeft: true }] });

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

        sheet.columns = [
            { width: 10 }, // A: رقم الطلب
            { width: 30 }, // B: الموظف
            { width: 25 }, // C: المسمى الوظيفي
            { width: 20 }, // D: نوع الطلب
            { width: 15 }, // E: الحالة
            { width: 20 }, // F: تاريخ التقديم
            { width: 40 }  // G: ملاحظات المدير
        ];

        if (logoId !== null) {
            sheet.addImage(logoId, { tl: { col: 3.5, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        sheet.getRow(1).height = 10;
        sheet.mergeCells('A1:G1');
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
        subTitleCell.value = 'النظام الإداري - طلبات الموظفين';
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('E2:G2');
        const typeCell = sheet.getCell('E2');
        typeCell.value = 'نوع التقرير: سجل طلبات الموظفين';
        typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const printDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells('E3:G3');
        const dateCell = sheet.getCell('E3');
        dateCell.value = `تاريخ التصدير: ${printDate}`;
        dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.mergeCells('E4:G4');
        const statusCell = sheet.getCell('E4');
        statusCell.value = 'حالة التقرير: معتمد ✔';
        statusCell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
        statusCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.getRow(5).height = 15;

        const statRowIndex = 7;
        sheet.mergeCells(`A${statRowIndex}:G${statRowIndex}`);
        const statCell = sheet.getCell(`A${statRowIndex}`);
        statCell.value = `📊 إجمالي الطلبات: ${stats.pending + stats.approved + stats.rejected}   |   ⏳ معلقة: ${stats.pending}   |   ✅ معتمدة: ${stats.approved}   |   ❌ مرفوضة: ${stats.rejected}`;
        statCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
        statCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        statCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } };
        statCell.border = {
            top: { style: 'medium', color: { argb: 'FF96CF75' } },
            bottom: { style: 'medium', color: { argb: 'FF96CF75' } },
            left: { style: 'medium', color: { argb: 'FF96CF75' } },
            right: { style: 'medium', color: { argb: 'FF96CF75' } }
        };
        sheet.getRow(statRowIndex).height = 30;

        sheet.getRow(8).height = 10;

        const headers = ['رقم الطلب', 'الموظف', 'المسمى الوظيفي', 'نوع الطلب', 'الحالة', 'تاريخ التقديم', 'ملاحظات المدير'];
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

        requests.data.forEach((req) => {
            let statusLabel = '';
            let statusColor = 'FF212529';
            let statusBg = null;

            if (req.status === 'approved') {
                statusLabel = 'معتمد';
                statusColor = 'FF15803D';
                statusBg = 'FFDCFCE7';
            } else if (req.status === 'rejected') {
                statusLabel = 'مرفوض';
                statusColor = 'FFDC2626';
                statusBg = 'FFFEE2E2';
            } else {
                statusLabel = 'معلق';
                statusColor = 'FFD97706';
                statusBg = 'FFFEF3C7';
            }

            const rowData = [
                req.id,
                req.employee?.user?.name || '-',
                req.employee?.job_title || '-',
                req.type_label || '-',
                statusLabel,
                new Date(req.created_at).toLocaleDateString('ar-EG'),
                req.manager_notes || '-'
            ];

            const row = sheet.addRow(rowData);
            row.height = 35;
            
            row.eachCell((cell, colNumber) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
                };
                
                if (colNumber === 5) {
                    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: statusColor } };
                    if (statusBg) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusBg } };
                    }
                }
            });
        });

        sheet.autoFilter = `A9:G${requests.data.length + 9}`;
        sheet.views = [{ state: 'frozen', ySplit: 9, rightToLeft: true }];

        sheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 }
        };

        sheet.headerFooter.oddFooter = '&L&10مدارس القيم الأهلية &C&10صفحة &P من &N &R&10تاريخ الطباعة: &D';

        await sheet.protect('SmartSchool123', {
            selectLockedCells: true,
            selectUnlockedCells: true,
            formatCells: true,
            formatColumns: true,
            formatRows: true,
            sort: false,
            autoFilter: false,
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `طلبات_الموظفين_${new Date().toISOString().split('T')[0]}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        });
    };

    const openReview = (req, status) => {
        setReviewingRequest(req);
        setSignatureData(null);
        reset();
        setData({
            status: status,
            manager_notes: '',
            manager_signature: '',
            updated_details: req.details || {},
        });
    };

    const closeReview = () => {
        setReviewingRequest(null);
        setSignatureData(null);
        reset();
    };

    const handleSignature = (dataUrl) => {
        setSignatureData(dataUrl);
        setData('manager_signature', dataUrl || '');
    };

    const submitReview = (e) => {
        e.preventDefault();
        if (data.status === 'approved' && !signatureData) {
            alert('يرجى إضافة توقيعك الإلكتروني لاعتماد الطلب.');
            return;
        }
        post(route('hr.requests.review', reviewingRequest.id), {
            onSuccess: () => closeReview(),
        });
    };

    const applyFilter = (key, val) => {
        router.get(route('hr.requests.index'), { ...filters, [key]: val }, { preserveState: true, preserveScroll: true });
    };

    return (
        <AdminLayout activeMenu="إدارة الطلبات">
            <Head title="إدارة طلبات الموظفين" />

            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                        </svg>
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">إدارة طلبات الموظفين</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">مراجعة واعتماد الطلبات الواردة من الموظفين</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button
                                onClick={exportToExcel}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm text-sm font-bold transition-all"
                                title="تصدير إلى Excel"
                            >
                                <Download size={18} />
                                <span className="hidden md:inline">تصدير</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'معلقة', value: stats.pending, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10', icon: Clock },
                        { label: 'معتمدة', value: stats.approved, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', icon: CheckCircle },
                        { label: 'مرفوضة', value: stats.rejected, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-500/10', icon: XCircle },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-[#121820]/60 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center gap-4">
                            <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center`}>
                                <stat.icon size={22} className={stat.color} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-slate-400">{stat.label}</p>
                                <h3 className={`text-2xl font-black ${stat.color}`}>{stat.value}</h3>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 p-4">
                    <div className="flex flex-wrap gap-3 items-center">
                        <Filter size={16} className="text-slate-400 shrink-0" />
                        <div className="flex flex-wrap gap-2">
                            {[{ value: '', label: 'الكل' }, { value: 'pending', label: 'معلق' }, { value: 'approved', label: 'معتمد' }, { value: 'rejected', label: 'مرفوض' }].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => applyFilter('status', opt.value)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filters.status === opt.value || (!filters.status && opt.value === '') ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-wrap gap-2 mr-4 border-r border-slate-200 dark:border-slate-700 pr-4">
                            {[{ value: '', label: 'جميع الأنواع' }, ...Object.entries(types).map(([k, v]) => ({ value: k, label: v }))].map(opt => (
                                <button
                                    key={opt.value}
                                    onClick={() => applyFilter('type', opt.value)}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${filters.type === opt.value || (!filters.type && opt.value === '') ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Requests Table */}
                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    {requests.data.length === 0 ? (
                        <div className="py-16 text-center">
                            <FileText size={48} className="text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-bold text-slate-600 dark:text-slate-400">لا توجد طلبات</h3>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right">
                                <thead>
                                    <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الموظف</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">نوع الطلب</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">الحالة</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">تاريخ التقديم</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">التوقيع</th>
                                        <th className="py-4 px-6 text-sm font-bold text-slate-500 dark:text-slate-400">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {requests.data.map(req => {
                                        const TypeIcon = TYPE_ICONS[req.type] || FileText;
                                        const statusCfg = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
                                        return (
                                            <tr key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                                <td className="py-4 px-6">
                                                    <div className="font-bold text-slate-800 dark:text-white">{req.employee?.user?.name || '-'}</div>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300">
                                                        <TypeIcon size={15} className="text-primary-500" />
                                                        {req.type_label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6">
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusCfg.bg} ${statusCfg.text}`}>
                                                        {req.status_label}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-6 text-sm text-slate-500 dark:text-slate-400">
                                                    {new Date(req.created_at).toLocaleDateString('ar-EG')}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.employee_signature_url ? (
                                                        <img src={req.employee_signature_url} alt="توقيع الموظف" className="h-8 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 bg-white" />
                                                    ) : (
                                                        <span className="text-xs text-slate-400">-</span>
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                onClick={() => openReview(req, 'approved')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors border border-emerald-200 dark:border-emerald-500/30"
                                                            >
                                                                <CheckCircle size={13} />
                                                                اعتماد
                                                            </button>
                                                            <button
                                                                onClick={() => openReview(req, 'rejected')}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors border border-red-200 dark:border-red-500/30"
                                                            >
                                                                <XCircle size={13} />
                                                                رفض
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xs text-slate-400">
                                                                {req.manager?.name || 'تم المراجعة'}
                                                            </span>
                                                            <button
                                                                onClick={() => setViewingRequest(req)}
                                                                className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-500 transition-colors"
                                                            >
                                                                <Eye size={16} />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Review Modal */}
            {reviewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={closeReview} />
                    <div className="relative bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                        {/* Header */}
                        <div className={`flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 shrink-0 ${data.status === 'approved' ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : 'bg-red-50/50 dark:bg-red-500/5'}`}>
                            <h3 className={`text-xl font-black flex items-center gap-3 ${data.status === 'approved' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                <div className={`p-2 rounded-xl ${data.status === 'approved' ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-red-100 dark:bg-red-500/20'}`}>
                                    {data.status === 'approved' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                                </div>
                                {data.status === 'approved' ? 'اعتماد الطلب' : 'رفض الطلب'}
                            </h3>
                            <button onClick={closeReview} className="text-slate-400 hover:text-slate-600 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-all hover:scale-105 active:scale-95">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={submitReview} className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                            {/* Request Summary */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-100 dark:border-slate-700/50 space-y-4">
                                <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                                        <User size={16} className="text-primary-500" />
                                        الموظف
                                    </span>
                                    <span className="font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700">{reviewingRequest.employee?.user?.name}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm pb-3 border-b border-slate-200 dark:border-slate-700">
                                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                                        <FileText size={16} className="text-blue-500" />
                                        نوع الطلب
                                    </span>
                                    <span className="font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">{reviewingRequest.type_label}</span>
                                </div>
                                
                                {/* Dynamic Details Display */}
                                {reviewingRequest.details && Object.entries(reviewingRequest.details).map(([key, val]) => {
                                    if(key === 'leave_type_id') return null;
                                    const formattedKey = {
                                        start_date: 'تاريخ البداية',
                                        end_date: 'تاريخ النهاية',
                                        amount: 'المبلغ',
                                        reason: 'السبب',
                                        item_name: 'الاسم/العنصر',
                                        description: 'الوصف',
                                        date: 'التاريخ',
                                        hours: 'عدد الساعات'
                                    }[key] || key;
                                    
                                    const Icon = key.includes('date') ? Calendar : key === 'amount' ? CreditCard : List;
                                    
                                    return (
                                        <div key={key} className="flex justify-between items-center text-sm pb-3 border-b border-slate-200 dark:border-slate-700 last:border-0 last:pb-0">
                                            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                                                <Icon size={16} className="text-slate-400" />
                                                {formattedKey}
                                            </span>
                                            <span className="font-bold text-slate-800 dark:text-white">{val}</span>
                                        </div>
                                    );
                                })}

                                {reviewingRequest.employee_notes && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                                            <MessageSquare size={14} className="text-amber-500" />
                                            ملاحظات الموظف
                                        </span>
                                        <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">{reviewingRequest.employee_notes}</p>
                                    </div>
                                )}
                                {reviewingRequest.employee_signature_url && (
                                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                                        <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs mb-2">
                                            <PenTool size={14} className="text-slate-500" />
                                            توقيع الموظف
                                        </span>
                                        <img src={reviewingRequest.employee_signature_url} alt="توقيع الموظف" className="h-14 border border-slate-200 dark:border-slate-700 rounded-xl p-1.5 bg-white shadow-sm" />
                                    </div>
                                )}
                            </div>

                            {/* Leave Balances Display and Type Change (Only for leaves & when approving) */}
                            {reviewingRequest.type === 'leave' && data.status === 'approved' && (
                                <div className="bg-primary-50 dark:bg-primary-500/5 border border-primary-200 dark:border-primary-500/20 rounded-2xl p-5 shadow-sm">
                                    <label className="text-sm font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                        <ClipboardList size={16} className="text-primary-500" />
                                        نوع الإجازة المراد الاستقطاع منها
                                    </label>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4">يمكنك تغيير نوع الإجازة أو الرصيد الذي سيتم خصم الأيام منه</p>
                                    <select
                                        value={data.updated_details.leave_type_id || ''}
                                        onChange={e => setData('updated_details', { ...data.updated_details, leave_type_id: e.target.value })}
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-sm"
                                        required
                                    >
                                        <option value="">-- اختر الرصيد --</option>
                                        {(leaveBalances[reviewingRequest.employee_id] || []).map(b => (
                                            <option key={b.leave_type_id} value={b.leave_type_id}>
                                                {b.leaveType?.name || 'نوع مجهول'} (متبقي: {Math.max(0, b.total_days - b.used_days)} يوم)
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Manager Notes */}
                            <div>
                                <label className="text-sm font-black text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                                    <FileEdit size={16} className={data.status === 'approved' ? 'text-primary-500' : 'text-red-500'} />
                                    {data.status === 'approved' ? 'ملاحظات الاعتماد (اختياري)' : 'سبب الرفض *'}
                                </label>
                                <textarea
                                    rows="3"
                                    value={data.manager_notes}
                                    onChange={e => setData('manager_notes', e.target.value)}
                                    required={data.status === 'rejected'}
                                    className="w-full bg-slate-50 dark:bg-[#0f141a] border border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-sm font-medium outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all shadow-inner resize-none"
                                    placeholder={data.status === 'approved' ? 'يمكنك إضافة ملاحظات...' : 'اكتب سبب الرفض هنا بوضوح...'}
                                />
                                {errors.manager_notes && <p className="text-xs font-bold text-red-500 mt-1 flex items-center gap-1"><X size={14} />{errors.manager_notes}</p>}
                            </div>

                            {/* Manager Signature (required for approval) */}
                            {data.status === 'approved' && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 shadow-inner">
                                    <label className="text-sm font-black text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                                        <PenLine size={18} className="text-primary-500" />
                                        توقيعي الإلكتروني (للاعتماد) <span className="text-red-500">*</span>
                                    </label>
                                    <SignaturePad
                                        onChange={handleSignature}
                                        error={errors.manager_signature}
                                    />
                                    {signatureData && (
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-3 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-500/10 w-fit px-3 py-1.5 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                            <CheckCircle size={14} />تم تسجيل التوقيع بنجاح
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="submit"
                                    disabled={processing || (data.status === 'approved' && !signatureData)}
                                    className={`flex-[2] text-white py-3.5 rounded-xl font-black flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:-translate-y-0.5 active:scale-95
                                        ${data.status === 'approved' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-emerald-500/30' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-500/30'}`}
                                >
                                    {data.status === 'approved' ? <ShieldCheck size={20} /> : <XCircle size={20} />}
                                    {processing ? 'جاري الحفظ...' : (data.status === 'approved' ? 'تأكيد الاعتماد' : 'تأكيد الرفض')}
                                </button>
                                <button type="button" onClick={closeReview} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3.5 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Read-only View Request Modal */}
            {viewingRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setViewingRequest(null)} />
                    <div className="relative bg-white dark:bg-[#121820] rounded-[2rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]">
                        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-100 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-800/20 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center shadow-inner">
                                    <Eye size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">تفاصيل الطلب بالكامل</h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                                        <Hash size={12} />
                                        رقم الطلب: {viewingRequest.id}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setViewingRequest(null)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm hover:scale-105 transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                            {/* Meta Cards Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-primary-500" />
                                        الموظف
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingRequest.employee?.user?.name || '-'}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                        المسمى الوظيفي
                                    </p>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingRequest.employee?.job_title || '-'}</span>
                                        {viewingRequest.employee?.job_grade && (
                                            <span className="text-[10px] bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full w-fit font-bold">{viewingRequest.employee.job_grade.name}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <FileText className="w-3.5 h-3.5 text-purple-500" />
                                        نوع الطلب
                                    </p>
                                    <p className="text-sm font-black text-purple-700 dark:text-purple-400">{viewingRequest.type_label}</p>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col justify-center">
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <Calendar className="w-3.5 h-3.5 text-orange-500" />
                                        تاريخ التقديم
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white">{new Date(viewingRequest.created_at).toLocaleDateString('ar-SA')}</p>
                                </div>
                            </div>
                            
                            {/* Status Card */}
                            <div className={`p-4 rounded-2xl border flex items-center justify-between
                                ${viewingRequest.status === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20' : 
                                  viewingRequest.status === 'rejected' ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 
                                  'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-xl 
                                        ${viewingRequest.status === 'approved' ? 'bg-emerald-200/50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                                          viewingRequest.status === 'rejected' ? 'bg-red-200/50 dark:bg-red-500/20 text-red-600 dark:text-red-400' : 
                                          'bg-amber-200/50 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'}`}>
                                        {viewingRequest.status === 'approved' ? <CheckCircle size={20} /> : viewingRequest.status === 'rejected' ? <XCircle size={20} /> : <Clock size={20} />}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-wider opacity-70 mb-0.5">حالة الطلب</p>
                                        <p className={`text-sm font-black 
                                            ${viewingRequest.status === 'approved' ? 'text-emerald-700 dark:text-emerald-400' : 
                                              viewingRequest.status === 'rejected' ? 'text-red-700 dark:text-red-400' : 
                                              'text-amber-700 dark:text-amber-400'}`}>{viewingRequest.status_label}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Additional Data */}
                            {viewingRequest.details && Object.keys(viewingRequest.details).length > 0 && (
                                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                                    <p className="text-sm font-black text-slate-800 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-3 mb-3 flex items-center gap-2">
                                        <List size={16} className="text-primary-500" />
                                        البيانات الإضافية للطلب
                                    </p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {Object.entries(viewingRequest.details).map(([k, v]) => {
                                            if (k === 'leave_type_id') return null;
                                            const formattedKey = {
                                                start_date: 'تاريخ البداية',
                                                end_date: 'تاريخ النهاية',
                                                amount: 'المبلغ',
                                                reason: 'السبب',
                                                item_name: 'الاسم/العنصر',
                                                description: 'الوصف',
                                                date: 'التاريخ',
                                                hours: 'عدد الساعات'
                                            }[k] || k;
                                            const Icon = k.includes('date') ? Calendar : k === 'amount' ? CreditCard : FileText;
                                            return (
                                                <div key={k} className="flex justify-between items-center text-sm p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                                    <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold">
                                                        <Icon size={14} className="text-slate-400" />
                                                        {formattedKey}
                                                    </span>
                                                    <span className="font-bold text-slate-800 dark:text-white">{v}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {viewingRequest.employee_notes && (
                                <div className="bg-blue-50/50 dark:bg-blue-500/5 p-5 rounded-2xl border border-blue-100 dark:border-blue-500/10">
                                    <p className="text-xs font-black text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-2">
                                        <MessageSquare size={14} />
                                        ملاحظات الموظف
                                    </p>
                                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{viewingRequest.employee_notes}</p>
                                </div>
                            )}

                            {/* Manager Review Info */}
                            <div className="mt-4 p-5 border border-primary-200 dark:border-primary-500/20 bg-primary-50/50 dark:bg-primary-500/5 rounded-2xl space-y-5">
                                <h4 className="font-black text-primary-700 dark:text-primary-300 text-sm flex items-center gap-2 border-b border-primary-200 dark:border-primary-500/20 pb-3">
                                    <ShieldCheck size={18} />
                                    بيانات المراجعة والإعتماد
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <User size={12} className="text-primary-500" />
                                            تمت المراجعة بواسطة
                                        </p>
                                        <p className="font-black text-slate-800 dark:text-white text-sm">{viewingRequest.manager?.name || '-'}</p>
                                    </div>
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700/50">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                            <Calendar size={12} className="text-primary-500" />
                                            تاريخ المراجعة
                                        </p>
                                        <p className="font-black text-slate-800 dark:text-white text-sm">
                                            {viewingRequest.reviewed_at ? new Date(viewingRequest.reviewed_at).toLocaleDateString('ar-SA') : '-'}
                                        </p>
                                    </div>
                                </div>
                                {viewingRequest.manager_notes && (
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-2">
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                            <Info size={12} className="text-primary-500" />
                                            ملاحظات الإدارة
                                        </p>
                                        <p className="text-sm text-slate-800 dark:text-white font-medium leading-relaxed">{viewingRequest.manager_notes}</p>
                                    </div>
                                )}
                                <div className="flex gap-4 pt-2">
                                    {viewingRequest.employee_signature_url && (
                                        <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                                                <PenTool size={12} className="text-slate-400" />
                                                توقيع الموظف
                                            </p>
                                            <img src={viewingRequest.employee_signature_url} className="h-14 mx-auto object-contain" alt="توقيع الموظف" />
                                        </div>
                                    )}
                                    {viewingRequest.manager_signature_url && (
                                        <div className="flex-1 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-center">
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-wider mb-2 flex items-center justify-center gap-1.5">
                                                <PenLine size={12} className="text-primary-500" />
                                                توقيع المدير
                                            </p>
                                            <img src={viewingRequest.manager_signature_url} className="h-14 mx-auto object-contain" alt="توقيع المدير" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        {/* Footer */}
                        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-end">
                            <button onClick={() => setViewingRequest(null)} className="px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-sm">
                                إغلاق
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
