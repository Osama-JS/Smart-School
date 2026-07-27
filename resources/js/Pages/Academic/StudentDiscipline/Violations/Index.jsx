import React, { useState, useMemo } from 'react';
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/themes/light.css';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, Trash2, FileText, CheckCircle, AlertTriangle, CalendarDays, Search, X, AlertCircle, User, Activity, Clock, FileBadge, Tag, Calendar, CheckSquare, AlignLeft, Shield, Filter, SlidersHorizontal, Download, ChevronDown, RotateCcw } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Violations({ auth, violations, types, students, grades, activeYearId }) {
    const { logo_url } = usePage().props;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingViolation, setEditingViolation] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [dateRange, setDateRange] = useState([]);
    const [selectedGrade, setSelectedGrade] = useState('');
    const [selectedDivision, setSelectedDivision] = useState('');
    const [selectedDegree, setSelectedDegree] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [repetitionLevel, setRepetitionLevel] = useState(null);
    const [isCheckingRepetition, setIsCheckingRepetition] = useState(false);

    const { data, setData, post, put, delete: destroy, errors, reset } = useForm({
        student_id: '',
        violation_type_id: '',
        violation_date: new Date().toISOString().split('T')[0],
        details: '',
        action_taken: '',
        academic_year_id: activeYearId,
        status: 'pending',
        attachment: null,
    });

    React.useEffect(() => {
        if (data.student_id && data.violation_type_id && !editingViolation) {
            setIsCheckingRepetition(true);
            fetch(route('academic.student-violations.check-repetition') + `?student_id=${data.student_id}&violation_type_id=${data.violation_type_id}`, {
                headers: { 'Accept': 'application/json' }
            })
            .then(res => res.json())
            .then(result => {
                setRepetitionLevel(result.repetition_level);
                setData(data => ({ ...data, action_taken: result.action_taken || data.action_taken }));
                setIsCheckingRepetition(false);
            })
            .catch(() => setIsCheckingRepetition(false));
        } else {
            setRepetitionLevel(null);
        }
    }, [data.student_id, data.violation_type_id]);

    const openModal = (violation = null) => {
        setEditingViolation(violation);
        if (violation) {
            setData({
                student_id: violation.student_id,
                violation_type_id: violation.violation_type_id,
                violation_date: violation.violation_date ? violation.violation_date.split('T')[0] : '',
                details: violation.details || '',
                action_taken: violation.action_taken || '',
                academic_year_id: violation.academic_year_id || activeYearId,
                status: violation.status || 'pending',
                attachment: null,
            });
            setRepetitionLevel(null);
        } else {
            reset();
            setData('academic_year_id', activeYearId);
            setData('status', 'pending');
            setData('violation_date', new Date().toISOString().split('T')[0]);
            setData('attachment', null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setRepetitionLevel(null);
        reset();
    };

    const submit = (e) => {
        e.preventDefault();
        if (editingViolation) {
            const formData = new FormData();
            formData.append('_method', 'PUT');
            Object.keys(data).forEach(key => {
                if (data[key] !== null) formData.append(key, data[key]);
            });
            
            router.post(route('academic.student-violations.update', editingViolation.id), formData, {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('academic.student-violations.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const confirmDelete = (violation) => {
        setEditingViolation(violation);
        setIsDeleteModalOpen(true);
    };

    const deleteViolation = () => {
        destroy(route('academic.student-violations.destroy', editingViolation.id), {
            onSuccess: () => setIsDeleteModalOpen(false),
        });
    };

    const handleTypeChange = (typeId) => {
        setData('violation_type_id', typeId);
        const selectedType = types.find(t => t.id.toString() === typeId.toString());
        if (selectedType && !editingViolation && !repetitionLevel) {
            setData(data => ({
                ...data,
                details: selectedType.description || '',
            }));
        }
    };

    const toggleStatus = (violation) => {
        const newStatus = violation.status === 'pending' ? 'resolved' : 'pending';
        router.put(route('academic.student-violations.update', violation.id), {
            ...violation,
            status: newStatus
        }, {
            preserveScroll: true
        });
    };

    const filteredViolations = useMemo(() => {
        return violations.filter(v => {
            const matchesSearch = !searchQuery || 
                v.student?.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                v.violation_type?.name?.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === '' || v.status === statusFilter;
            
            let matchesDate = true;
            if (dateRange && dateRange.length === 2) {
                const vDate = new Date(v.violation_date);
                const startDate = new Date(dateRange[0]);
                const endDate = new Date(dateRange[1]);
                startDate.setHours(0,0,0,0);
                endDate.setHours(23,59,59,999);
                matchesDate = vDate >= startDate && vDate <= endDate;
            }

            let matchesGrade = true;
            let matchesDivision = true;
            
            if (selectedGrade || selectedDivision) {
                const enrollment = v.student?.current_enrollment;
                const division = enrollment?.division;
                
                if (selectedGrade) {
                    matchesGrade = division?.grade_id?.toString() === selectedGrade.toString();
                }
                if (selectedDivision) {
                    matchesDivision = division?.id?.toString() === selectedDivision.toString();
                }
            }

            let matchesDegree = true;
            if (selectedDegree) {
                matchesDegree = v.violation_type?.degree?.toString() === selectedDegree.toString();
            }

            return matchesSearch && matchesStatus && matchesDate && matchesGrade && matchesDivision && matchesDegree;
        });
    }, [violations, searchQuery, statusFilter, dateRange, selectedGrade, selectedDivision, selectedDegree]);

    const stats = {
        total: violations.length,
        pending: violations.filter(v => v.status === 'pending').length,
        resolved: violations.filter(v => v.status === 'resolved').length,
    };

    const exportToExcel = async () => {
        if (filteredViolations.length === 0) return;

        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('سجل المخالفات', {
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
                    oddFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lنظام الانضباط الطلابي',
                    evenFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lنظام الانضباط الطلابي'
                }
            });

            // 1. Logo Fetching (Fallback to canvas)
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
                
                // Fallback using Canvas
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

            // 2. Columns Setup
            sheet.columns = [
                { width: 10 }, // Index
                { width: 30 }, // Student Name
                { width: 30 }, // Violation
                { width: 20 }, // Degree
                { width: 15 }, // Date
                { width: 40 }, // Action Taken
                { width: 15 }  // Status
            ];

            // 3. Document Header Styling
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
            subTitleCell.value = 'النظام الأكاديمي - سجل المخالفات السلوكية';
            subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } }; 
            subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            // Meta Info on Left Side
            const exportDate = new Date().toLocaleString('ar-EG');
            sheet.mergeCells('E2:G2');
            sheet.getCell('E2').value = `تاريخ التصدير: ${exportDate}`;
            sheet.getCell('E2').font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            sheet.getCell('E2').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.mergeCells('E3:G3');
            sheet.getCell('E3').value = `إجمالي المخالفات في التقرير: ${filteredViolations.length}`;
            sheet.getCell('E3').font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
            sheet.getCell('E3').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.mergeCells('E4:G4');
            sheet.getCell('E4').value = `تمت المعالجة: ${filteredViolations.filter(v => v.status === 'resolved').length} | قيد المعالجة: ${filteredViolations.filter(v => v.status === 'pending').length}`;
            sheet.getCell('E4').font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
            sheet.getCell('E4').alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

            sheet.getRow(5).height = 15;
            
            // Statistics banner row
            sheet.getRow(7).height = 30;
            sheet.mergeCells('A7:G7');
            const statsCell = sheet.getCell('A7');
            statsCell.value = `تقرير مخصص بناءً على فلاتر البحث المحددة (النطاق الزمني، الصفوف، درجات المخالفة)`;
            statsCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
            statsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } };
            statsCell.border = { top: { style: 'medium', color: { argb: 'FF96CF75' } }, bottom: { style: 'medium', color: { argb: 'FF96CF75' } }, left: { style: 'medium', color: { argb: 'FF96CF75' } }, right: { style: 'medium', color: { argb: 'FF96CF75' } } };

            sheet.getRow(8).height = 10;

            // 4. Table Headers
            const headerRow = sheet.addRow(["م", "اسم الطالب", "المخالفة", "الدرجة", "التاريخ", "الإجراء المُتخذ", "الحالة"]);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
                cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
            });

            // 5. Data Rows
            filteredViolations.forEach((v, index) => {
                const row = sheet.addRow([
                    index + 1,
                    v.student?.user?.name || 'غير متوفر',
                    v.violation_type?.name || 'غير متوفر',
                    v.violation_type?.degree ? `الدرجة ${v.violation_type.degree}` : '-',
                    new Date(v.violation_date).toLocaleDateString('ar-SA'),
                    v.action_taken || v.details || 'لا يوجد',
                    v.status === 'pending' ? 'قيد المعالجة' : 'تمت المعالجة',
                ]);

                row.height = 35;
                row.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                    cell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    
                    if (colNumber === 1 && typeof cell.value === 'number') {
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FF475569' } };
                    }
                });

                // Stripe effect
                if (index % 2 === 0) {
                    row.eachCell(cell => cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FCF7' } });
                }

                // Status colors
                const statusCell = row.getCell(7);
                if (v.status === 'resolved') {
                    statusCell.font = { color: { argb: 'FF558A2A' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCEFD1' } };
                } else {
                    statusCell.font = { color: { argb: 'FFCC2B2B' }, bold: true, name: 'Segoe UI', size: 10 };
                    statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } };
                }
            });

            // 6. Finalize & Save
            sheet.autoFilter = `A9:G${9 + filteredViolations.length}`;
            await sheet.protect('', { selectLockedCells: true, selectUnlockedCells: true, autoFilter: true, sort: true, formatCells: true, formatColumns: true, formatRows: true });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `سجل_المخالفات_${new Date().toISOString().slice(0, 10)}.xlsx`);
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

    const exportToPDF = () => {
        const logoPath = logo_url || '/images/logo.png';
        const exportDate = new Date().toLocaleString('ar-EG');
        const resolvedCount = filteredViolations.filter(v => v.status === 'resolved').length;
        const pendingCount = filteredViolations.filter(v => v.status === 'pending').length;

        const tableHtml = `
            <div style="direction: rtl; font-family: 'Cairo', sans-serif; padding: 20px; color: #1e293b;">
                
                <!-- Header Section -->
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 3px solid #6B9B37; padding-bottom: 15px;">
                    <div>
                        <h1 style="color: #6B9B37; margin: 0 0 5px 0; font-size: 26px; font-weight: 900;">مدارس القيم الأهلية</h1>
                        <h2 style="color: #475569; margin: 0 0 5px 0; font-size: 16px; font-weight: 700;">AL QIYAM CIVEL SCHOOLS</h2>
                        <h3 style="color: #e11d48; margin: 0; font-size: 14px; font-weight: bold;">النظام الأكاديمي - سجل المخالفات السلوكية</h3>
                    </div>
                    <img src="${logoPath}" alt="Logo" style="width: 85px; height: 85px; object-fit: contain;" />
                </div>

                <!-- Metadata & Stats Section -->
                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px;">
                    <div style="font-size: 13px;">
                        <p style="margin: 0 0 5px 0;"><strong>تاريخ التصدير:</strong> ${exportDate}</p>
                        <p style="margin: 0 0 5px 0;"><strong>إجمالي المخالفات في التقرير:</strong> ${filteredViolations.length}</p>
                        <p style="margin: 0;"><strong>حالة المعالجة:</strong> <span style="color: #6B9B37; font-weight: bold;">${resolvedCount} منجزة</span> | <span style="color: #b45309; font-weight: bold;">${pendingCount} قيد المعالجة</span></p>
                    </div>
                    <div style="text-align: left; font-size: 13px;">
                        <p style="margin: 0 0 5px 0; color: #475569;">تقرير مخصص (مفلتر)</p>
                        <p style="margin: 0; font-weight: bold; color: #6B9B37;">حالة التقرير: معتمد ✔</p>
                    </div>
                </div>

                <!-- Data Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px;">
                    <thead>
                        <tr>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: center; border: 1px solid #6B9B37; width: 5%;">م</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: right; border: 1px solid #6B9B37; width: 20%;">اسم الطالب</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: right; border: 1px solid #6B9B37; width: 25%;">المخالفة</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: center; border: 1px solid #6B9B37; width: 10%;">الدرجة</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: center; border: 1px solid #6B9B37; width: 10%;">التاريخ</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: right; border: 1px solid #6B9B37; width: 20%;">الإجراء المُتخذ</th>
                            <th style="background-color: #6B9B37; color: white; padding: 12px 8px; text-align: center; border: 1px solid #6B9B37; width: 10%;">الحالة</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filteredViolations.map((v, index) => {
                            const isEven = index % 2 === 0;
                            const bgColor = isEven ? '#f9fcf7' : '#ffffff';
                            const statusColor = v.status === 'resolved' ? '#15803d' : '#b45309';
                            const statusBg = v.status === 'resolved' ? '#dcfce7' : '#fef3c7';
                            const statusText = v.status === 'resolved' ? 'تمت المعالجة' : 'قيد المعالجة';
                            const degree = v.violation_type?.degree ? `الدرجة ${v.violation_type.degree}` : '-';
                            
                            return `
                                <tr style="background-color: ${bgColor};">
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${index + 1}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; font-weight: bold;">${v.student?.user?.name || '-'}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0;">${v.violation_type?.name || '-'}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">${degree}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center; direction: ltr;">${new Date(v.violation_date).toLocaleDateString('ar-SA')}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; color: #475569;">${v.action_taken || v.details || 'لا يوجد'}</td>
                                    <td style="padding: 10px 8px; border: 1px solid #e2e8f0; text-align: center;">
                                        <span style="background-color: ${statusBg}; color: ${statusColor}; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px;">
                                            ${statusText}
                                        </span>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
                
                <!-- Footer -->
                <div style="text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                    تم إنشاء هذا التقرير تلقائياً من نظام الانضباط الطلابي - مدارس القيم الأهلية
                </div>
            </div>
        `;

        const element = document.createElement('div');
        element.innerHTML = tableHtml;

        html2pdf().from(element).set({
            margin: 10,
            filename: 'تقرير_المخالفات.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'landscape', unit: 'mm', format: 'a4', compressPDF: true }
        }).save();
    };

    return (
        <AdminLayout user={auth.user} activeMenu="سجل المخالفات (طلاب)">
            <Head title="سجل المخالفات الطلابية" />

            <div className="max-w-[1600px] mx-auto space-y-6">
                
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
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
                                <FileText size={28} className="text-primary-600" />
                                سجل المخالفات الطلابية
                            </h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">تتبع المخالفات السلوكية للطلاب وإدارة إجراءاتها</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <Link
                                href={route('academic.student-violations.analytics')}
                                className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#121820] text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-500/20 rounded-2xl hover:shadow-lg hover:shadow-primary-500/5 text-sm font-bold transition-all active:scale-95"
                            >
                                <Activity size={18} />
                                <span>التحليل السلوكي</span>
                            </Link>
                            <button
                                onClick={() => openModal()}
                                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl hover:shadow-lg hover:shadow-primary-500/10 text-sm font-bold transition-all active:scale-95"
                            >
                                <Plus size={18} />
                                <span>تسجيل مخالفة جديدة</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-2">
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-primary-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Activity className="text-primary-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">إجمالي المخالفات</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.total}</h4>
                        </div>
                    </div>
                    
                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-amber-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <Clock className="text-amber-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">قيد المعالجة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.pending}</h4>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#121820]/60 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center gap-5 transition-all hover:shadow-md hover:-translate-y-1 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 rounded-full mix-blend-multiply filter blur-2xl opacity-10 bg-emerald-500 transition-transform group-hover:scale-150" />
                        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 relative z-10">
                            <CheckCircle className="text-emerald-500" size={28} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-1">تمت المعالجة</p>
                            <h4 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{stats.resolved}</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#121820]/60 p-3 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                    <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl w-full xl:w-auto overflow-x-auto custom-scrollbar shrink-0">
                        {[
                            { value: '', label: 'الكل' }, 
                            { value: 'pending', label: 'قيد المعالجة' }, 
                            { value: 'resolved', label: 'تمت المعالجة' }
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

                    <div className="flex items-center gap-3 w-full xl:w-auto shrink-0 flex-1 xl:flex-none justify-end">
                        <div className="relative w-full max-w-sm">
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <Search size={16} className="text-slate-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="ابحث باسم الطالب أو المخالفة..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/40 border-none rounded-2xl py-2.5 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white placeholder-slate-400 transition-all"
                            />
                        </div>

                        {/* Export Buttons */}
                        <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl">
                            <button
                                onClick={exportToExcel}
                                disabled={isExporting}
                                title="تصدير إلى Excel"
                                className={`w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#121820] text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 shadow-sm transition-colors ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                {isExporting ? <span className="animate-spin rounded-full h-4 w-4 border-2 border-emerald-500 border-t-transparent" /> : <Download size={18} />}
                            </button>
                            <button
                                onClick={exportToPDF}
                                title="تصدير كتقرير PDF"
                                className="w-10 h-10 flex items-center justify-center rounded-xl bg-white dark:bg-[#121820] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 shadow-sm transition-colors"
                            >
                                <FileText size={18} />
                            </button>
                        </div>

                        <button
                            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all border ${
                                (dateRange.length > 0 || selectedGrade || selectedDivision || selectedDegree)
                                    ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-200 dark:border-primary-500/30 text-primary-600 dark:text-primary-400'
                                    : 'bg-white dark:bg-[#121820] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                            }`}
                        >
                            <SlidersHorizontal size={18} />
                            <span className="hidden sm:inline">فلاتر متقدمة</span>
                            {(dateRange.length > 0 || selectedGrade || selectedDivision || selectedDegree) && (
                                <span className="flex h-2 w-2 relative">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                                </span>
                            )}
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isFiltersOpen ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {isFiltersOpen && (
                    <div className="bg-white dark:bg-[#121820]/80 p-6 rounded-3xl border border-primary-100 dark:border-primary-500/20 shadow-md shadow-primary-500/5 animate-slide-down">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                <Filter className="text-primary-500" size={20} />
                                تخصيص البحث (فلاتر متقدمة)
                            </h3>
                            <button
                                onClick={() => {
                                    setDateRange([]);
                                    setSelectedGrade('');
                                    setSelectedDivision('');
                                    setSelectedDegree('');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-500 bg-rose-50 dark:bg-rose-500/10 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-500/20 transition-colors"
                            >
                                <RotateCcw size={14} /> إعادة ضبط الفلاتر
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Date Range */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                                    النطاق الزمني
                                    {dateRange.length > 0 && (
                                        <button onClick={() => setDateRange([])} className="text-xs text-rose-500 hover:text-rose-600 font-bold flex items-center gap-1">
                                            <X size={12} /> مسح
                                        </button>
                                    )}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <Calendar className="text-slate-400" size={18} />
                                    </div>
                                    <Flatpickr
                                        options={{ mode: "range", dateFormat: "Y-m-d", locale: "ar" }}
                                        value={dateRange}
                                        onChange={(date) => setDateRange(date)}
                                        placeholder="من تاريخ - إلى تاريخ"
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl py-3 pr-10 pl-4 text-sm focus:ring-2 focus:ring-primary-500/20 text-slate-800 dark:text-white transition-all outline-none"
                                    />
                                </div>
                            </div>

                            {/* Grade & Division */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">الصف والشعبة</label>
                                <div className="flex gap-2">
                                    <div className="flex-1">
                                        <SelectInput
                                            options={[{ value: '', label: 'جميع الصفوف' }, ...(grades?.map(g => ({ value: g.id, label: g.name })) || [])]}
                                            value={selectedGrade}
                                            onChange={val => { setSelectedGrade(val); setSelectedDivision(''); }}
                                            className="w-full"
                                        />
                                    </div>
                                    {selectedGrade && (
                                        <div className="flex-1 animate-fade-in-up">
                                            <SelectInput
                                                options={[{ value: '', label: 'جميع الشعب' }, ...(grades.find(g => g.id.toString() === selectedGrade.toString())?.divisions?.map(d => ({ value: d.id, label: d.name })) || [])]}
                                                value={selectedDivision}
                                                onChange={val => setSelectedDivision(val)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Severity Degree */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">درجة المخالفة</label>
                                <SelectInput
                                    options={[
                                        { value: '', label: 'جميع الدرجات' },
                                        { value: '1', label: 'مخالفات الدرجة الأولى' },
                                        { value: '2', label: 'مخالفات الدرجة الثانية' },
                                        { value: '3', label: 'مخالفات الدرجة الثالثة' },
                                        { value: '4', label: 'مخالفات الدرجة الرابعة' },
                                        { value: '5', label: 'مخالفات الدرجة الخامسة' },
                                        { value: '6', label: 'مخالفات الدرجة السادسة' },
                                    ]}
                                    value={selectedDegree}
                                    onChange={val => setSelectedDegree(val)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-right">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/20 border-b border-slate-100 dark:border-slate-800">
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الطالب</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">المخالفة والتاريخ</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-1/3">التفاصيل والإجراء</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">المشرف المباشر</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400">الحالة</th>
                                    <th className="py-4 px-6 text-sm font-black text-slate-500 dark:text-slate-400 w-24">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredViolations.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="py-12 text-center">
                                            <div className="flex flex-col items-center justify-center text-slate-500">
                                                <AlertCircle size={40} className="mb-3 text-slate-300" />
                                                <p className="font-bold">لا توجد مخالفات مسجلة</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredViolations.map((v) => (
                                        <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                                                        <User size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm">{v.student?.user?.name || '-'}</p>
                                                        <p className="text-xs text-slate-500 mt-0.5">الرقم: {v.student?.student_number || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-primary-600 dark:text-primary-400 text-sm mb-1">{v.violation_type?.name || '-'}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                                                    <CalendarDays size={12} />
                                                    {v.violation_date}
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="text-xs text-slate-600 dark:text-slate-300 max-w-sm">
                                                    <p className="mb-1 truncate font-semibold"><span className="text-slate-400">التفاصيل:</span> {v.details}</p>
                                                    <p className="truncate font-bold text-amber-600 dark:text-amber-400"><span className="text-slate-400">الإجراء:</span> {v.action_taken}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                {v.supervisor?.name || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button 
                                                    onClick={() => toggleStatus(v)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all hover:scale-105 ${
                                                    v.status === 'resolved' 
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' 
                                                        : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20'
                                                }`}>
                                                    {v.status === 'resolved' ? <CheckCircle size={12} /> : <Clock size={12} />}
                                                    {v.status === 'resolved' ? 'تمت المعالجة' : 'قيد المعالجة'}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-2">
                                                    {v.attachment_path && (
                                                        <a href={`/storage/${v.attachment_path}`} target="_blank" rel="noopener noreferrer" className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/20 transition-all shadow-sm">
                                                            <FileBadge size={14} />
                                                        </a>
                                                    )}
                                                    <button onClick={() => openModal(v)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/20 transition-all shadow-sm">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => confirmDelete(v)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all shadow-sm">
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

            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm overflow-y-auto">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-2xl shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-800 my-auto transform transition-all">
                        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                        {editingViolation ? 'تعديل سجل المخالفة' : 'تسجيل مخالفة جديدة'}
                                    </h3>
                                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-1">تعبئة نموذج المخالفة والإجراء المتخذ</p>
                                </div>
                            </div>
                            <button onClick={closeModal} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-300 rounded-2xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8">
                            {repetitionLevel >= 2 && !editingViolation && (
                                <div className="mb-6 bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-2xl p-4 flex gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-rose-800 dark:text-rose-400 mb-1">
                                            تنبيه تصعيد آلي! (تكرار للمرة {repetitionLevel})
                                        </h4>
                                        <p className="text-sm font-semibold text-rose-600 dark:text-rose-300">
                                            لقد ارتكب هذا الطالب نفس المخالفة مسبقاً. عند حفظ هذه المخالفة، سيقوم النظام <span className="font-black">تلقائياً</span> بتوليد (استدعاء ولي أمر) و (تعهد سلوكي) دون الحاجة لتدخلك.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <form onSubmit={submit} className="space-y-6">
                                {!editingViolation && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الطالب المخالف <span className="text-rose-500">*</span></label>
                                            <SelectInput
                                                options={[{ value: '', label: '-- اختر الطالب --' }, ...students.map(s => ({ value: s.id, label: s.user?.name }))]}
                                                value={data.student_id}
                                                onChange={val => setData('student_id', val)}
                                                className="w-full"
                                                required
                                            />
                                            {errors.student_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.student_id}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">نوع المخالفة <span className="text-rose-500">*</span></label>
                                            <SelectInput
                                                options={[{ value: '', label: '-- اختر نوع المخالفة --' }, ...types.map(t => ({ value: t.id, label: t.name }))]}
                                                value={data.violation_type_id}
                                                onChange={val => handleTypeChange(val)}
                                                className="w-full"
                                                required
                                            />
                                            {errors.violation_type_id && <p className="text-xs text-rose-500 font-semibold mt-1.5">{errors.violation_type_id}</p>}
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تاريخ وقوع المخالفة <span className="text-rose-500">*</span></label>
                                        <FlatpickrInput
                                            type="date"
                                            value={data.violation_date}
                                            onChange={(val) => setData('violation_date', val)}
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pl-5 pr-12 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            required
                                        />
                                    </div>
                                    
                                    {editingViolation && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">حالة المعالجة</label>
                                            <SelectInput
                                                options={[
                                                    { value: 'pending', label: 'قيد المعالجة' },
                                                    { value: 'resolved', label: 'تمت المعالجة' },
                                                ]}
                                                value={data.status}
                                                onChange={val => setData('status', val)}
                                                className="w-full"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">تفاصيل المخالفة المرتكبة <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all dark:text-white"
                                            value={data.details}
                                            onChange={e => setData('details', e.target.value)}
                                            rows="3"
                                            required
                                            placeholder="اكتب وصفاً موجزاً لما حدث..."
                                        />
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-slate-400">
                                            <AlignLeft size={16} />
                                        </div>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">الإجراء المتخذ <span className="text-rose-500">*</span></label>
                                    <div className="relative">
                                        <textarea
                                            className="w-full bg-slate-50 dark:bg-slate-900/50 border border-amber-200 dark:border-amber-700/50 rounded-2xl pr-12 pl-5 py-3.5 text-sm focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all dark:text-white"
                                            value={data.action_taken}
                                            onChange={e => setData('action_taken', e.target.value)}
                                            rows="2"
                                            required
                                            placeholder="ما هو الإجراء الذي تم اتخاذه حيال هذه المخالفة؟"
                                        />
                                        <div className="pointer-events-none absolute top-4 right-0 flex items-center pr-4 text-amber-500">
                                            <Shield size={16} />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">مرفقات (اختياري)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            id="attachment-upload"
                                            className="hidden"
                                            onChange={e => setData('attachment', e.target.files[0])}
                                            accept=".pdf,.jpg,.jpeg,.png"
                                        />
                                        <label 
                                            htmlFor="attachment-upload"
                                            className={`flex items-center gap-4 p-4 rounded-2xl border-2 border-dashed cursor-pointer transition-all w-full
                                                ${data.attachment ? 'bg-primary-50 dark:bg-primary-500/10 border-primary-300 dark:border-primary-500/30' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                        >
                                            <div className={`w-12 h-12 flex items-center justify-center rounded-xl shrink-0 transition-colors
                                                ${data.attachment ? 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-500 group-hover:text-primary-500 group-hover:bg-primary-50 dark:group-hover:bg-primary-500/10'}`}>
                                                {data.attachment ? <CheckCircle size={24} /> : <FileBadge size={24} />}
                                            </div>
                                            <div className="flex-1 overflow-hidden">
                                                <p className={`font-bold truncate text-sm mb-1 ${data.attachment ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {data.attachment ? data.attachment.name : 'انقر لاختيار ملف أو اسحب الملف هنا'}
                                                </p>
                                                <p className="text-xs text-slate-500 font-semibold truncate">
                                                    {data.attachment ? (data.attachment.size / 1024 / 1024).toFixed(2) + ' MB' : 'يدعم PDF, JPG, PNG (الحد الأقصى 2MB)'}
                                                </p>
                                            </div>
                                        </label>
                                    </div>
                                    {errors.attachment && <p className="text-xs text-rose-500 mt-2 font-semibold flex items-center gap-1"><AlertCircle size={14}/> {errors.attachment}</p>}
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                                    <button type="button" onClick={closeModal} className="px-6 py-3.5 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                        إلغاء
                                    </button>
                                    <button type="submit" className="flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-primary-500/20 hover:shadow-primary-500/30 active:scale-95">
                                        <CheckCircle size={18} />
                                        <span>حفظ المخالفة</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#121820] rounded-[2.5rem] w-full max-w-sm p-8 text-center shadow-2xl border border-slate-100 dark:border-slate-800 transform transition-all">
                        <div className="w-20 h-20 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6 relative">
                            <Trash2 size={32} className="relative z-10" />
                            <div className="absolute inset-0 bg-rose-500 opacity-20 rounded-full blur-xl animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">تأكيد الحذف</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold mb-8">
                            هل أنت متأكد من حذف هذه المخالفة من السجل؟ لا يمكن التراجع عن هذا الإجراء.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-2xl font-bold transition-colors">
                                إلغاء
                            </button>
                            <button onClick={deleteViolation} className="flex-1 py-4 text-white bg-rose-500 hover:bg-rose-600 rounded-2xl font-bold transition-colors shadow-lg shadow-rose-500/20">
                                تأكيد الحذف
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}
