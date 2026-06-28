import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';

import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import SecondaryButton from '@/Components/SecondaryButton';
import { BookOpen, Trash, Eye, Calendar, User, Filter, X, FileText, CheckCircle, Clock, CheckSquare, AlignLeft, Info, Download } from 'lucide-react';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';

export default function Index({ auth, preparations, teachers, grades, subjects, filters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPrep, setViewingPrep] = useState(null);
    const { logo_url } = usePage().props;

    const { delete: destroy } = useForm();

    const openModal = (preparation) => {
        setViewingPrep(preparation);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setViewingPrep(null);
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: "لن تتمكن من التراجع عن هذا!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء'
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('academic.lesson-preparations.destroy', id));
            }
        });
    };

    const handleFilterChange = (key, value) => {
        router.get(route('academic.lesson-preparations'), {
            ...filters,
            [key]: value
        }, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    const exportToExcel = async () => {
        if (!preparations?.data || preparations.data.length === 0) {
            alert('لا توجد بيانات لتصديرها');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('دفاتر التحضير', { views: [{ rightToLeft: true }] });

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
            { width: 20 }, // A: تاريخ التنفيذ
            { width: 30 }, // B: المعلم
            { width: 25 }, // C: الصف
            { width: 25 }, // D: المادة
            { width: 40 }, // E: عنوان الدرس
        ];

        if (logoId !== null) {
            sheet.addImage(logoId, { tl: { col: 2.5, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        sheet.getRow(1).height = 10;
        sheet.mergeCells('A1:E1');
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

        sheet.mergeCells('A2:B2');
        const titleCell = sheet.getCell('A2');
        titleCell.value = 'مدارس القيم الأهلية';
        titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF6B9B37' } };
        titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A3:B3');
        const enTitleCell = sheet.getCell('A3');
        enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
        enTitleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF6B9B37' } };
        enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A4:B4');
        const subTitleCell = sheet.getCell('A4');
        subTitleCell.value = 'النظام الإداري - دفاتر التحضير ومتابعة الدروس';
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('D2:E2');
        const typeCell = sheet.getCell('D2');
        typeCell.value = 'نوع التقرير: سجل دفاتر التحضير';
        typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const printDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells('D3:E3');
        const dateCell = sheet.getCell('D3');
        dateCell.value = `تاريخ التصدير: ${printDate}`;
        dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.mergeCells('D4:E4');
        const statusCell = sheet.getCell('D4');
        statusCell.value = 'حالة التقرير: معتمد ✔';
        statusCell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
        statusCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.getRow(5).height = 15;

        const headers = ['تاريخ التنفيذ', 'المعلم', 'الصف', 'المادة', 'عنوان الدرس'];
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

        preparations.data.forEach((prep) => {
            const rowData = [
                prep.preparation_date || '-',
                prep.teacher?.name || '-',
                `${prep.grade?.name || '-'} ${prep.division ? `- ${prep.division.name}` : ''}`,
                prep.subject?.name || '-',
                prep.lesson_title || '-'
            ];

            const row = sheet.addRow(rowData);
            row.height = 35;
            
            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
                };
            });
        });

        sheet.autoFilter = `A6:E${preparations.data.length + 6}`;
        sheet.views = [{ state: 'frozen', ySplit: 6, rightToLeft: true }];

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
            anchor.download = `دفاتر_التحضير_${new Date().toISOString().split('T')[0]}.xlsx`;
            anchor.click();
            window.URL.revokeObjectURL(url);
        });
    };

    return (
        <AdminLayout user={auth.user}>
            <Head title="دفاتر التحضير ومتابعة الدروس" />

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
                                <BookOpen size={28} className="text-primary-600" />
                                دفاتر التحضير ومتابعة الدروس
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">متابعة سجلات إنجاز الدروس والواجبات الخاصة بالمعلمين</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
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

                <div className="space-y-6">
                    
                    {/* Filters Section */}
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden mb-6">
                        <div className="absolute top-0 right-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent" />
                        <div className="flex items-center gap-2 mb-4">
                            <Filter size={18} className="text-primary-500" />
                            <h3 className="font-bold text-slate-800 dark:text-white">تصفية النتائج</h3>
                        </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="group flex flex-col">
                                    <InputLabel value="المعلم" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                        value={filters.teacher_id || ''}
                                        onChange={(v) => handleFilterChange('teacher_id', v?.value || '')}
                                        placeholder="كل المعلمين"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="الصف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={grades.map(g => ({ value: g.id, label: g.name }))}
                                        value={filters.grade_id || ''}
                                        onChange={(v) => handleFilterChange('grade_id', v?.value || '')}
                                        placeholder="كل الصفوف"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="المادة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <SelectInput
                                        className="w-full"
                                        options={subjects.map(s => ({ value: s.id, label: s.name }))}
                                        value={filters.subject_id || ''}
                                        onChange={(v) => handleFilterChange('subject_id', v?.value || '')}
                                        placeholder="كل المواد"
                                        isClearable
                                    />
                                </div>
                                <div className="group flex flex-col">
                                    <InputLabel value="تاريخ التنفيذ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                    <div className="mt-1 relative">
                                        <FlatpickrInput
                                            value={filters.date_range || ''}
                                            onChange={(dates, str) => handleFilterChange('date_range', str)}
                                            options={{
                                                mode: 'range',
                                                dateFormat: 'Y-m-d',
                                            }}
                                            placeholder="من - إلى"
                                            className="w-full pl-10 !py-[11px] border-slate-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
                                        />
                                        <Calendar className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    {/* Table Card */}
                    <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-200/60">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">تاريخ التنفيذ</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المعلم</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الصف والمادة</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">عنوان الدرس</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {preparations.data.length > 0 ? preparations.data.map((prep) => (
                                        <tr key={prep.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-slate-400" />
                                                    {prep.preparation_date}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                                                        {prep.teacher?.name?.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {prep.teacher?.name}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 font-medium">{prep.subject?.name}</div>
                                                <div className="text-xs text-gray-500">{prep.grade?.name} {prep.division ? `- ${prep.division.name}` : ''}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 line-clamp-1">{prep.lesson_title}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => openModal(prep)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-primary-600 hover:bg-primary-50 transition-colors" title="عرض التفاصيل">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                    {auth.permissions?.includes('إدارة دفاتر التحضير') && (
                                                        <button onClick={() => confirmDelete(prep.id)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 text-red-600 hover:bg-red-50 transition-colors" title="حذف">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                لا توجد سجلات تحضير مطابقة للبحث
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {preparations.links && (
                            <div className="p-4 border-t">
                                <Pagination links={preparations.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                {viewingPrep && (
                    <div className="relative bg-white dark:bg-[#121820] w-full max-h-[85vh] overflow-y-auto custom-scrollbar rounded-2xl">
                        {/* Decorative Header Background */}
                        <div className="absolute top-0 right-0 left-0 h-32 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800/60 dark:via-primary-900/60 dark:to-slate-900 overflow-hidden">
                            <div className="absolute inset-0 opacity-10 dark:opacity-5 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                            <div className="absolute top-5 -left-10 w-24 h-24 bg-primary-400/20 rounded-full blur-xl pointer-events-none"></div>
                        </div>

                        {/* Modal Header */}
                        <div className="relative px-6 pt-6 pb-5 flex justify-between items-start">
                            <div className="flex gap-4 items-center text-white">
                                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg shadow-black/10">
                                    <BookOpen className="w-7 h-7 text-white drop-shadow-md" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold backdrop-blur-md border border-white/20 shadow-sm">
                                            سجل إنجاز
                                        </span>
                                        <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white text-[9px] font-bold backdrop-blur-md border border-white/10 flex items-center gap-1 shadow-sm">
                                            <Calendar className="w-2.5 h-2.5" />
                                            {viewingPrep.preparation_date}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                                        تفاصيل إنجاز الحصة
                                    </h2>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all border border-white/10 hover:scale-105 active:scale-95 shadow-sm">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="relative px-6 pb-6 space-y-5">
                            
                            {/* Meta Info Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-2">
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-primary-200 dark:hover:border-primary-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-primary-500 rounded-r-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-primary-500" />
                                        المعلم المنفذ
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingPrep.teacher?.name}</p>
                                </div>
                                
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-purple-200 dark:hover:border-purple-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-purple-500 rounded-r-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                                        المادة الدراسية
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingPrep.subject?.name}</p>
                                </div>
                                
                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-center relative overflow-hidden group hover:border-orange-200 dark:hover:border-orange-500/30 transition-colors">
                                    <div className="absolute top-0 right-0 w-1 h-full bg-orange-500 rounded-r-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                        <User className="w-3.5 h-3.5 text-orange-500" />
                                        الصف والشعبة
                                    </p>
                                    <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">
                                        {viewingPrep.grade?.name} {viewingPrep.division ? `- ${viewingPrep.division.name}` : ''}
                                    </p>
                                </div>
                            </div>

                            {/* Lesson Title Section */}
                            <div className="bg-primary-50/50 dark:bg-primary-500/5 rounded-2xl p-5 border border-primary-100/50 dark:border-primary-500/10 shadow-sm">
                                <h4 className="text-xs font-black text-primary-600 dark:text-primary-400 mb-2 flex items-center gap-2">
                                    <AlignLeft className="w-4 h-4" />
                                    عنوان الحصة / الدرس
                                </h4>
                                <div className="text-slate-800 dark:text-slate-100 font-bold text-base md:text-lg leading-relaxed">
                                    {viewingPrep.lesson_title}
                                </div>
                            </div>

                            {/* Rich Content Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Topics Covered */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm h-full">
                                    <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                        <CheckSquare className="w-4 h-4" />
                                        ما تم دراسته
                                    </h4>
                                    <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {viewingPrep.topics_covered ? viewingPrep.topics_covered : <span className="text-slate-400 dark:text-slate-500 italic">لم يتم إدخال تفاصيل إضافية.</span>}
                                    </div>
                                </div>

                                {/* Homework */}
                                <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm h-full">
                                    <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                        <FileText className="w-4 h-4" />
                                        الواجب المنزلي
                                    </h4>
                                    <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {viewingPrep.homework ? viewingPrep.homework : <span className="text-slate-400 dark:text-slate-500 italic">لا يوجد واجب منزلي.</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {viewingPrep.notes && (
                                <div className="bg-amber-50/30 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-100/50 dark:border-amber-500/10 shadow-sm">
                                    <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        ملاحظات المعلم
                                    </h4>
                                    <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                        {viewingPrep.notes}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl flex justify-end gap-3 z-20 rounded-b-2xl">
                            <button onClick={closeModal} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors shadow-sm text-sm">
                                إغلاق
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
