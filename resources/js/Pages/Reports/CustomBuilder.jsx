import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Settings, Download, FileText, ArrowRight,
    Users, GraduationCap, Calendar, CheckSquare, Eye, Save, Bookmark, GripVertical,
    Filter, Plus, Trash2, Briefcase, ShieldCheck, ChevronRight, ChevronLeft, Check, Layers, List, PieChart, ChevronDown
} from 'lucide-react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';
import Select from 'react-select';

export default function CustomBuilder({ auth, teachersList = [], studentsList = [], employeesList = [], supervisorsList = [], gradesList = [] }) {
    const { logo_url, app_name } = usePage().props;
    const [entity, setEntity] = useState('teachers');
    const [selectedGrade, setSelectedGrade] = useState([]);
    const [selectedDivision, setSelectedDivision] = useState([]);
    const [fields, setFields] = useState(['name', 'department', 'absences']);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [columns, setColumns] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [filters, setFilters] = useState([]);
    const [page, setPage] = useState(1);
    const [paginationMeta, setPaginationMeta] = useState(null);
    const [groupBy, setGroupBy] = useState('');
    const [isTemplatesOpen, setIsTemplatesOpen] = useState(false);
    const templatesRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (templatesRef.current && !templatesRef.current.contains(event.target)) {
                setIsTemplatesOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const saved = localStorage.getItem('report_templates');
        if (saved) {
            setTemplates(JSON.parse(saved));
        }
    }, []);

    const teacherFields = [
        { id: 'name', label: 'الاسم' },
        { id: 'department', label: 'القسم' },
        { id: 'absences', label: 'إجمالي الغياب' },
        { id: 'appraisal', label: 'نتيجة التقييم (تقديرية)' },
        { id: 'leaves', label: 'إجمالي الإجازات' },
        { id: 'requests', label: 'الطلبات الإدارية المرفوعة' },
        { id: 'violations', label: 'المخالفات الإدارية' },
        { id: 'achievements', label: 'الإنجازات والدورات' },
        { id: 'master_timetables', label: 'إجمالي الحصص (النصاب)' },
        { id: 'substitute_coverages', label: 'إجمالي حصص الاحتياط' },
        { id: 'lesson_preparations', label: 'التحضيرات المرفوعة' },
        { id: 'meetings_total', label: 'إجمالي الاجتماعات المطلوبة' },
        { id: 'meetings_absent', label: 'الاجتماعات التي غاب عنها' },
        { id: 'created_at', label: 'تاريخ التعيين' },
    ];

    const studentFields = [
        { id: 'name', label: 'الاسم' },
        { id: 'grade', label: 'الصف' },
        { id: 'absences', label: 'إجمالي الغياب' },
        { id: 'clinic_visits', label: 'إجمالي زيارات العيادة' },
        { id: 'medical_record', label: 'حالة الملف الطبي' },
        { id: 'parent_summons', label: 'إجمالي الاستدعاءات' },
        { id: 'parent_visits', label: 'إجمالي زيارات ولي الأمر' },
        { id: 'student_violations', label: 'المخالفات السلوكية' },
        { id: 'student_pledges', label: 'التعهدات الموقعة' },
        { id: 'monthly_grades', label: 'إجمالي السجلات الشهرية' },
        { id: 'semester_results', label: 'إجمالي نتائج الفصول' },
        { id: 'gamification_points', label: 'إجمالي نقاط التحفيز' },
        { id: 'gamification_achievements', label: 'الأوسمة والإنجازات' },
        { id: 'created_at', label: 'تاريخ التسجيل' },
    ];

    const [availableFields, setAvailableFields] = useState(teacherFields);

    const customSelectClassNames = {
        control: (state) => `
            flex bg-white dark:bg-slate-900 
            border ${state.isFocused ? 'border-primary-400 dark:border-primary-500 ring-2 ring-primary-500/20' : 'border-slate-200 dark:border-slate-700'} 
            rounded-xl px-1 py-0 text-sm transition-all text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm min-h-[38px]
        `,
        menu: () => "mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-[60]",
        menuList: () => "p-1 max-h-[200px] overflow-y-auto",
        option: (state) => `
            px-4 py-2.5 rounded-lg text-sm cursor-pointer transition-colors
            ${state.isSelected ? 'bg-primary-500 text-white' : 
              state.isFocused ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300' : 
              'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'}
        `,
        multiValue: () => "bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-lg m-1 flex items-center border border-primary-100 dark:border-primary-800/50",
        multiValueLabel: () => "px-2 py-0.5 text-xs font-bold",
        multiValueRemove: () => "px-2 hover:bg-primary-100 dark:hover:bg-primary-800 hover:text-primary-800 dark:hover:text-primary-200 rounded-l-lg transition-colors cursor-pointer",
        placeholder: () => "text-slate-400 dark:text-slate-500",
        singleValue: () => "text-slate-800 dark:text-slate-200",
        input: () => "text-slate-800 dark:text-slate-200 outline-none",
        indicatorSeparator: () => "bg-slate-200 dark:bg-slate-700 my-1",
        dropdownIndicator: () => "p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer",
        clearIndicator: () => "p-1 text-slate-400 hover:text-accent-500 cursor-pointer"
    };

    const dragItem = useRef(null);
    const dragOverItem = useRef(null);

    const handleSort = () => {
        let _availableFields = [...availableFields];
        const draggedItemContent = _availableFields.splice(dragItem.current, 1)[0];
        _availableFields.splice(dragOverItem.current, 0, draggedItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setAvailableFields(_availableFields);
        
        // Update the selected fields order to match the new visual order
        const newSelectedFields = _availableFields
            .filter(f => fields.includes(f.id))
            .map(f => f.id);
        setFields(newSelectedFields);
    };

    const toggleField = (fieldId) => {
        if (fields.includes(fieldId)) {
            setFields(fields.filter(f => f !== fieldId));
        } else {
            // Add while respecting the visual order of availableFields
            const newFields = [...fields, fieldId];
            const sortedNewFields = availableFields
                .filter(f => newFields.includes(f.id))
                .map(f => f.id);
            setFields(sortedNewFields);
        }
    };

    const setQuickDate = (type) => {
        const today = new Date();
        const formatDate = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        if (type === 'today') {
            const dateStr = formatDate(today);
            setStartDate(dateStr);
            setEndDate(dateStr);
        } else if (type === 'week') {
            const day = today.getDay();
            const diff = today.getDate() - day + (day === 0 ? -6 : 1);
            const firstDay = new Date(new Date().setDate(diff));
            const lastDay = new Date(new Date().setDate(diff + 6));
            setStartDate(formatDate(firstDay));
            setEndDate(formatDate(lastDay));
        } else if (type === 'month') {
            const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
            const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            setStartDate(formatDate(firstDay));
            setEndDate(formatDate(lastDay));
        } else if (type === 'all') {
            setStartDate('');
            setEndDate('');
        }
    };

    const handleEntitySelect = (newEntity, selectedName) => {
        setEntity(newEntity);
        if (['teachers', 'supervisors'].includes(newEntity)) {
            setAvailableFields(teacherFields);
            setFields(['name', 'department', 'absences']);
        } else {
            setAvailableFields(studentFields);
            setFields(['name', 'grade', 'absences']);
            setSelectedGrade([]);
            setSelectedDivision([]);
        }

        if (selectedName === 'all') {
            setFilters([]);
        } else if (Array.isArray(selectedName)) {
            if (selectedName.length === 0) {
                setFilters([]);
            } else {
                setFilters([{ id: Date.now(), field: 'name', operator: '=', value: selectedName, logic: 'and' }]);
                toast.success(`تم تخصيص التقرير للمحددين`);
            }
        } else {
            setFilters([{ id: Date.now(), field: 'name', operator: '=', value: selectedName, logic: 'and' }]);
            toast.success(`تم تخصيص التقرير لـ: ${selectedName}`);
        }

        setResults([]);
        setPage(1);
        setPaginationMeta(null);
        setGroupBy('');
    };

    const getInputType = (fieldId) => {
        if (fieldId === 'created_at') return 'date';
        if (['name', 'department', 'grade', 'medical_record', 'appraisal'].includes(fieldId)) return 'text';
        return 'number';
    };

    const addFilter = () => {
        setFilters([...filters, { id: Date.now(), field: availableFields[0].id, operator: '=', value: '', logic: 'and' }]);
    };

    const removeFilter = (id) => {
        setFilters(filters.filter(f => f.id !== id));
    };

    const updateFilter = (id, key, val) => {
        setFilters(filters.map(f => f.id === id ? { ...f, [key]: val } : f));
    };

    const saveTemplate = () => {
        const name = prompt('أدخل اسماً لهذا القالب (مثال: تقرير غياب المعلمين الشهري):');
        if (!name) return;

        const newTemplate = {
            id: Date.now().toString(),
            name,
            entity,
            fields,
            startDate,
            endDate,
            filters
        };

        const updatedTemplates = [...templates, newTemplate];
        setTemplates(updatedTemplates);
        localStorage.setItem('report_templates', JSON.stringify(updatedTemplates));
        toast.success('تم حفظ القالب بنجاح');
    };

    const loadTemplate = (e) => {
        const templateId = e.target.value;
        if (!templateId) return;
        
        const template = templates.find(t => t.id === templateId);
        if (template) {
            setEntity(template.entity);
            const newAvailable = ['teachers', 'supervisors', 'employees'].includes(template.entity) ? teacherFields : studentFields;
            // Order available fields based on the saved fields order
            const orderedAvailable = [];
            template.fields.forEach(fid => {
                const f = newAvailable.find(af => af.id === fid);
                if (f) orderedAvailable.push(f);
            });
            newAvailable.forEach(af => {
                if (!template.fields.includes(af.id)) orderedAvailable.push(af);
            });

            setAvailableFields(orderedAvailable);
            setFields(template.fields);
            setStartDate(template.startDate || '');
            setEndDate(template.endDate || '');
            setFilters(template.filters || []);
            toast.success(`تم تطبيق القالب: ${template.name}`);
        }
        e.target.value = ''; // Reset select
    };

    const generatePreview = async (targetPage = 1) => {
        if (fields.length === 0) {
            toast.error('الرجاء اختيار حقل واحد على الأقل');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(route('reports.custom.generate'), {
                entity,
                fields,
                start_date: startDate,
                end_date: endDate,
                filters,
                group_by: groupBy,
                page: targetPage
            });

            const data = response.data.data;
            setResults(data);
            setPaginationMeta(response.data.meta);
            setPage(targetPage);
            
            if (data.length > 0) {
                setColumns(Object.keys(data[0]));
            } else {
                setColumns([]);
                toast.error('لا توجد بيانات مطابقة لهذه المعايير');
            }
        } catch (error) {
            toast.error('حدث خطأ أثناء جلب البيانات');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && (!paginationMeta || newPage <= paginationMeta.last_page)) {
            generatePreview(newPage);
        }
    };

    const exportToExcel = async () => {
        if (results.length === 0) return;
        
        toast.loading('جاري تجهيز ملف الإكسل...', { id: 'excel-export' });
        try {
            const response = await axios.post(route('reports.custom.generate'), {
                entity,
                fields,
                start_date: startDate,
                end_date: endDate,
                filters,
                group_by: groupBy,
                is_export: true
            });
            
            const exportData = response.data.data;
            if (exportData.length === 0) {
                toast.error('لا توجد بيانات للتصدير', { id: 'excel-export' });
                return;
            }

            // إعطاء المتصفح فرصة لتحديث واجهة المستخدم (إظهار رسالة التحميل) قبل التجميد
            await new Promise(resolve => setTimeout(resolve, 50));

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('تقرير مخصص', { views: [{ rightToLeft: true }] });
            
            const exportColumns = Object.keys(exportData[0]);

            // Helper to get Excel column letter (0 = A, 1 = B ...)
            const getColLetter = (index) => {
                let letter = '';
                let temp = index;
                while (temp >= 0) {
                    letter = String.fromCharCode((temp % 26) + 65) + letter;
                    temp = Math.floor(temp / 26) - 1;
                }
                return letter;
            };
            const lastColLetter = getColLetter(exportColumns.length - 1);
            
            // Add Logo
            let logoId = null;
            if (logo_url) {
                try {
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
                } catch(e) {}
            }

            // Insert logo if exists
            if (logoId !== null) {
                const logoColIndex = exportColumns.length > 5 ? Math.floor(exportColumns.length / 2) - 0.5 : 2;
                sheet.addImage(logoId, { tl: { col: logoColIndex, row: 1.1 }, ext: { width: 85, height: 85 } });
            }

            // Add Top Border / Accent Line
            sheet.getRow(1).height = 10;
            sheet.mergeCells(`A1:${lastColLetter}1`);
            sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

            // Title Rows
            const titleSpan = exportColumns.length >= 3 ? 'C' : lastColLetter;
            sheet.mergeCells(`A2:${titleSpan}2`);
            const titleCell = sheet.getCell('A2');
            titleCell.value = 'مدارس القيم الأهلية';
            titleCell.font = { name: 'Segoe UI', size: 24, bold: true, color: { argb: 'FF6B9B37' } };
            titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            sheet.mergeCells(`A3:${titleSpan}3`);
            const enTitleCell = sheet.getCell('A3');
            enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
            enTitleCell.font = { name: 'Segoe UI', size: 16, bold: true, color: { argb: 'FF6B9B37' } };
            enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            const entityName = entity === 'teachers' ? 'المعلمين' : entity === 'students' ? 'الطلاب' : 'الموظفين';
            sheet.mergeCells(`A4:${titleSpan}4`);
            const subTitleCell = sheet.getCell('A4');
            subTitleCell.value = `النظام الإداري - تقرير ${entityName}`;
            subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
            subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

            // Meta data on the left
            if (exportColumns.length >= 5) {
                const metaStartCol = getColLetter(exportColumns.length - 3);
                const metaEndCol = lastColLetter;
                
                sheet.mergeCells(`${metaStartCol}2:${metaEndCol}2`);
                const typeCell = sheet.getCell(`${metaStartCol}2`);
                typeCell.value = `نوع التقرير: مخصص (${entityName})`;
                typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
                typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

                const printDate = new Date().toLocaleString('ar-EG');
                sheet.mergeCells(`${metaStartCol}3:${metaEndCol}3`);
                const dateCell = sheet.getCell(`${metaStartCol}3`);
                dateCell.value = `تاريخ التصدير: ${printDate}`;
                dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
                dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

                sheet.mergeCells(`${metaStartCol}4:${metaEndCol}4`);
                const statusCell = sheet.getCell(`${metaStartCol}4`);
                statusCell.value = 'حالة التقرير: معتمد ✔';
                statusCell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
                statusCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            }

            // Row 5: Empty Spacer
            sheet.getRow(5).height = 15;

            // Period Information / Filters Applied
            const periodRowIndex = 6;
            sheet.mergeCells(`A${periodRowIndex}:${lastColLetter}${periodRowIndex}`);
            const periodCell = sheet.getCell(`A${periodRowIndex}`);
            const dateText = (startDate || endDate) ? `من: ${startDate || 'الكل'} إلى: ${endDate || 'الكل'}` : 'الفترة: الكل';
            periodCell.value = dateText;
            periodCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FF1E293B' } };
            periodCell.alignment = { horizontal: 'center', vertical: 'middle' };
            periodCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
            sheet.getRow(periodRowIndex).height = 30;

            // Statistics Bar
            const statRowIndex = 7;
            const totalRecords = exportData.length;
            const absencesCol = exportColumns.find(c => c.includes('غياب') || c.includes('absences'));
            let totalAbsences = 0;
            if (absencesCol) {
                totalAbsences = exportData.reduce((sum, row) => sum + (Number(row[absencesCol]) || 0), 0);
            }
            
            sheet.mergeCells(`A${statRowIndex}:${lastColLetter}${statRowIndex}`);
            const statCell = sheet.getCell(`A${statRowIndex}`);
            statCell.value = `📊 إجمالي السجلات: ${totalRecords}   |   ⚠️ إجمالي الغياب: ${totalAbsences} يوم`;
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

            // Set Headers (Row 9)
            const headerRow = sheet.getRow(9);
            headerRow.values = exportColumns;
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } }; // Brand Green
                cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    left: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } },
                    right: { style: 'thin', color: { argb: 'FFFFFFFF' } }
                };
            });

            // Add Data
            exportData.forEach((row, index) => {
                const rowData = exportColumns.map(col => row[col] ?? '-');
                const excelRow = sheet.addRow(rowData);
                excelRow.height = 25;
                
                excelRow.eachCell((cell, colNumber) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                    cell.border = {
                        bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                        left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                        right: { style: 'thin', color: { argb: 'FFDEE2E6' } }
                    };
                    
                    // Critical value highlighting (e.g., absences > 5)
                    const colName = exportColumns[colNumber - 1];
                    if ((colName.includes('غياب') || colName.includes('absences')) && Number(row[colName]) > 5) {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
                        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFB91C1C' } };
                    }
                });
            });

            // Add Auto-filters
            sheet.autoFilter = `A9:${lastColLetter}${exportData.length + 9}`;

            // Freeze panes
            sheet.views = [{ state: 'frozen', ySplit: 9, rightToLeft: true }];

            // Auto-adjust Column Widths
            sheet.columns.forEach((column) => {
                let maxLength = 10;
                column.eachCell({ includeEmpty: true }, (cell) => {
                    // Skip metadata rows to avoid skewing width
                    if (cell.row && cell.row <= 8) return;
                    const columnLength = cell.value ? cell.value.toString().length : 10;
                    if (columnLength > maxLength) {
                        maxLength = columnLength;
                    }
                });
                column.width = maxLength < 15 ? 15 : maxLength + 3;
            });

            const buffer = await workbook.xlsx.writeBuffer();
            saveAs(new Blob([buffer]), `تقرير_مخصص_${new Date().getTime()}.xlsx`);
            toast.success('تم تصدير ملف الإكسل بنجاح', { id: 'excel-export' });
        } catch (error) {
            toast.error('حدث خطأ أثناء التصدير', { id: 'excel-export' });
            console.error(error);
        }
    };

    const exportToPDF = async () => {
        if (results.length === 0) return;
        
        toast.loading('جاري تجهيز ملف الـ PDF...', { id: 'pdf-export' });
        try {
            // Fetch all data for export
            const response = await axios.post(route('reports.custom.generate'), {
                entity,
                fields,
                start_date: startDate,
                end_date: endDate,
                filters,
                group_by: groupBy,
                is_export: true
            });
            
            const exportData = response.data.data;
            if (exportData.length === 0) {
                toast.error('لا توجد بيانات للتصدير', { id: 'pdf-export' });
                return;
            }

            const exportColumns = Object.keys(exportData[0]);

            // Generate Executive Summary Stats
            const totalRecords = exportData.length;
            const absencesCol = exportColumns.find(c => c.includes('غياب') || c.includes('absences'));
            const categoryCol = exportColumns.find(c => c.includes('قسم') || c.includes('صف') || c.includes('department') || c.includes('grade'));
            
            let avgAbsencesText = null;
            if (absencesCol) {
                const total = exportData.reduce((sum, row) => sum + (Number(row[absencesCol]) || 0), 0);
                const avg = totalRecords > 0 ? (total / totalRecords).toFixed(1) : 0;
                avgAbsencesText = `${avg} يوم`;
            }

            let topCategoryText = null;
            let topCategoryName = null;
            if (categoryCol) {
                const counts = {};
                exportData.forEach(row => {
                    const val = row[categoryCol];
                    if (val && val !== '-') counts[val] = (counts[val] || 0) + 1;
                });
                const topCategory = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0];
                if (topCategory) {
                    topCategoryText = topCategory;
                    topCategoryName = categoryCol.includes('قسم') ? 'أعلى قسم' : (categoryCol.includes('صف') ? 'أعلى صف' : 'الأكثر تكراراً');
                }
            }

            const summaryCardsHTML = `
                <div style="margin-bottom: 30px;">
                    <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 700;">الملخص التنفيذي للبيانات:</h4>
                    <div style="display: flex; gap: 20px;">
                        <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-right: 4px solid #6b9b37; border-radius: 8px; padding: 18px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="color: #64748b; font-size: 13px; font-weight: 700; margin-bottom: 8px;">إجمالي السجلات</div>
                            <div style="color: #0f172a; font-size: 30px; font-weight: 900; line-height: 1;">${totalRecords} <span style="font-size: 14px; font-weight: 600; color: #94a3b8;">سجل</span></div>
                        </div>
                        ${avgAbsencesText ? `
                        <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-right: 4px solid #f59e0b; border-radius: 8px; padding: 18px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="color: #64748b; font-size: 13px; font-weight: 700; margin-bottom: 8px;">متوسط الغياب</div>
                            <div style="color: #0f172a; font-size: 30px; font-weight: 900; line-height: 1;">${avgAbsencesText} <span style="font-size: 14px; font-weight: 600; color: #94a3b8;">أيام</span></div>
                        </div>
                        ` : ''}
                        ${topCategoryText ? `
                        <div style="flex: 1; background-color: #ffffff; border: 1px solid #e2e8f0; border-right: 4px solid #558a2a; border-radius: 8px; padding: 18px 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
                            <div style="color: #64748b; font-size: 13px; font-weight: 700; margin-bottom: 8px;">${topCategoryName}</div>
                            <div style="color: #0f172a; font-size: 22px; font-weight: 900; line-height: 1.2;">${topCategoryText}</div>
                        </div>
                        ` : ''}
                    </div>
                </div>
            `;

            // Create a temporary container for the PDF content
            const element = document.createElement('div');
            // Adding a class to prevent it from displaying in the actual DOM if it was appended (though we just pass it to html2pdf)
            element.innerHTML = `
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
                <style>
                    /* Settings for repeating table headers across pages */
                    @media print {
                        thead { display: table-header-group; }
                        tr { page-break-inside: avoid; }
                    }
                </style>
                <div style="font-family: 'Cairo', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; text-align: right; padding: 40px; color: #1e293b; background-color: white; position: relative; z-index: 1;">
                    
                    <!-- Watermark -->
                    ${logo_url ? `
                    <div style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; display: flex; align-items: center; justify-content: center; z-index: -1; pointer-events: none; opacity: 0.04;">
                        <img src="${logo_url}" style="width: 50%; max-width: 450px; filter: grayscale(100%);" />
                    </div>
                    ` : ''}

                    <!-- Official Document Header -->
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 10px; margin-bottom: 10px;">
                        
                        <!-- Right side: Organization Details -->
                        <div style="text-align: right; line-height: 1.7; width: 33%;">
                            <div style="font-size: 13px; font-weight: 800; color: #0f172a;">الجمهورية اليمنية</div>
                            <div style="font-size: 12px; font-weight: 600; color: #334155;">وزارة التربية والتعليم والبحث العلمي</div>
                            <div style="font-size: 12px; font-weight: 600; color: #6b9b37; margin-top: 4px;">إدارة نظام مدارس القيم الأهلية</div>
                            <div style="font-size: 11px; font-weight: 500; color: #64748b;">نظام الإدارة المدرسية الشامل</div>
                        </div>

                        <!-- Center: Logo -->
                        <div style="text-align: center; width: 33%; display: flex; flex-direction: column; align-items: center; justify-content: center;">
                            ${logo_url ? `<img src="${logo_url}" style="height: 90px; object-fit: contain;" />` : `<div style="font-size: 28px; font-weight: 900; color: #6b9b37; letter-spacing: -1px; border: 2px solid #6b9b37; padding: 10px 20px; border-radius: 8px;">مدارس القيم</div>`}
                        </div>

                        <!-- Left side: Report Metadata -->
                        <div style="text-align: left; width: 33%;">
                            <div style="display: inline-block; text-align: right; min-width: 160px; font-size: 11px; line-height: 1.6; color: #1e293b;">
                                <div style="font-size: 15px; font-weight: 900; color: #6b9b37; margin-bottom: 6px; border-bottom: 2px solid #e2e8f0; padding-bottom: 4px;">تقرير ${entity === 'teachers' ? 'المعلمين' : entity === 'students' ? 'الطلاب' : 'الموظفين'}</div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">المرجع:</span> <strong style="font-family: monospace; font-size: 12px;">#${Math.floor(Math.random() * 900000) + 100000}</strong></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">التاريخ:</span> <strong>${new Date().toLocaleDateString('ar-EG')}</strong></div>
                                <div style="display: flex; justify-content: space-between;"><span style="color: #64748b;">الوقت:</span> <strong>${new Date().toLocaleTimeString('ar-EG', {hour: '2-digit', minute:'2-digit'})}</strong></div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Decorative Official Divider -->
                    <div style="height: 4px; background-color: #6b9b37; width: 100%; margin-bottom: 2px;"></div>
                    <div style="height: 1px; background-color: #558a2a; width: 100%; margin-bottom: 25px;"></div>

                    <!-- Filters Summary (Optional) -->
                    ${filters.length > 0 ? `
                    <div style="margin-bottom: 25px; background-color: #f8fafc; padding: 15px 20px; border-radius: 8px; border: 1px solid #e2e8f0; border-right: 4px solid #6b9b37;">
                        <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 14px; font-weight: 700;">نطاق التقرير والبيانات المفلترة:</h4>
                        <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                            ${filters.map(f => {
                                let opStr = f.operator;
                                if (opStr === '=') opStr = ':';
                                else if (opStr === 'LIKE') opStr = 'يحتوي على';
                                else if (opStr === '>') opStr = 'أكبر من';
                                else if (opStr === '<') opStr = 'أصغر من';
                                else if (opStr === '>=') opStr = 'أكبر أو يساوي';
                                else if (opStr === '<=') opStr = 'أصغر أو يساوي';
                                else if (opStr === '!=') opStr = 'لا يساوي';
                                
                                return `<span style="display: inline-block; background-color: white; padding: 6px 12px; border-radius: 6px; font-size: 12px; border: 1px solid #dcefd1; color: #1e293b; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                                    <span style="color: #64748b;">${availableFields.find(af => af.id === f.field)?.label || f.field}</span> 
                                    <strong style="color: #6b9b37; margin: 0 4px;">${opStr}</strong> 
                                    <strong>${f.value}</strong>
                                </span>`;
                            }).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <!-- Executive Summary -->
                    ${summaryCardsHTML}

                    <!-- Data Table -->
                    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; border: 1px solid #dcefd1;">
                        <thead>
                            <tr>
                                ${exportColumns.map((col, i) => `
                                    <th style="background-color: #6b9b37; color: #ffffff; padding: 14px 12px; border: 1px solid #558a2a; font-weight: 800; text-align: right;">
                                        ${col}
                                    </th>
                                `).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${exportData.map((row, index) => `
                                <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f0f7eb'}; transition: background-color 0.2s; page-break-inside: avoid;">
                                    ${exportColumns.map(col => {
                                        let cellStyle = "padding: 12px; border: 1px solid #e2e8f0; color: #1e293b; font-weight: 600;";
                                        // Critical value highlighting
                                        if ((col.includes('غياب') || col.includes('absences')) && Number(row[col]) > 5) {
                                            cellStyle += " background-color: #fee2e2; color: #b91c1c; font-weight: 800; border-color: #fca5a5;";
                                        }
                                        return `<td style="${cellStyle}">
                                            ${row[col] !== null && row[col] !== undefined && row[col] !== '' ? row[col] : '<span style="color: #cbd5e1;">-</span>'}
                                        </td>`;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    
                    <!-- Signatures Section -->
                    <div style="margin-top: 50px; padding: 25px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; page-break-inside: avoid;">
                        <h4 style="margin: 0 0 30px 0; color: #0f172a; font-size: 15px; font-weight: 800; text-align: right; border-bottom: 2px solid #6b9b37; display: inline-block; padding-bottom: 6px;">الاعتمادات والتوقيعات الرسمية</h4>
                        <div style="display: flex; justify-content: space-between; align-items: flex-end; text-align: center; margin-top: 10px;">
                            <div style="width: 25%;">
                                <div style="color: #334155; font-size: 13px; font-weight: 700; margin-bottom: 50px;">مُعِد التقرير</div>
                                <div style="border-bottom: 1px dashed #94a3b8; margin-bottom: 10px;"></div>
                                <div style="color: #64748b; font-size: 11px;">الاسم / التوقيع</div>
                            </div>
                            <div style="width: 25%;">
                                <div style="color: #334155; font-size: 13px; font-weight: 700; margin-bottom: 50px;">المراجع / المدقق</div>
                                <div style="border-bottom: 1px dashed #94a3b8; margin-bottom: 10px;"></div>
                                <div style="color: #64748b; font-size: 11px;">الاسم / التوقيع</div>
                            </div>
                            <div style="width: 25%;">
                                <div style="color: #334155; font-size: 13px; font-weight: 700; margin-bottom: 50px;">المدير العام (يعتمد)</div>
                                <div style="border-bottom: 1px solid #64748b; margin-bottom: 10px;"></div>
                                <div style="color: #475569; font-size: 11px; font-weight: 600;">الختم الرسمي والتوقيع</div>
                            </div>
                        </div>
                    </div>

                    <!-- Footer -->
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #64748b; position: relative;">
                        <!-- Accent line -->
                        <div style="position: absolute; top: -1px; right: 0; width: 120px; height: 3px; background-color: #6b9b37;"></div>
                        
                        <div>
                            <strong style="color: #1e293b;">وثيقة رسمية</strong> - تم الاستخراج آلياً من نظام <strong style="color: #6b9b37;">القيم ERP</strong>
                        </div>
                        <div style="display: flex; gap: 15px; align-items: center;">
                            <span>جميع الحقوق محفوظة &copy; ${new Date().getFullYear()}</span>
                            <span style="color: #cbd5e1;">|</span>
                            <span style="color: #1e293b; font-weight: 700;">مدارس القيم الأهلية</span>
                        </div>
                    </div>
                </div>
            `;

            const opt = {
                margin:       [10, 10, 10, 10],
                filename:     `تقرير_${entity}_${new Date().getTime()}.pdf`,
                image:        { type: 'jpeg', quality: 1 },
                pagebreak:    { mode: ['css', 'legacy'] },
                html2canvas:  { scale: 2, useCORS: true, logging: false, letterRendering: true },
                jsPDF:        { unit: 'mm', format: 'a4', orientation: 'landscape' }
            };

            // إعطاء المتصفح فرصة لتحديث واجهة المستخدم قبل عملية الرندر الثقيلة جداً
            await new Promise(resolve => setTimeout(resolve, 100));

            await html2pdf().set(opt).from(element).save();
            toast.success('تم تصدير ملف الـ PDF بنجاح 📄', { id: 'pdf-export' });
        } catch (error) {
            toast.error('حدث خطأ أثناء التصدير', { id: 'pdf-export' });
            console.error(error);
        }
    };

    return (
        <AdminLayout>
            <Head title="منشئ التقارير" />
            
            <style type="text/css" media="print">
                {`
                    @page { size: landscape; margin: 10mm; }
                    body { background: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    body * { visibility: hidden; }
                    #report-table-container, #report-table-container * { visibility: visible; }
                    #report-table-container { 
                        position: absolute; 
                        left: 0; 
                        top: 0; 
                        width: 100%; 
                        border: none !important; 
                        box-shadow: none !important; 
                        background: white !important; 
                        padding: 0; 
                        margin: 0; 
                    }
                    /* Ensure tables look good */
                    table { border-collapse: collapse; width: 100%; }
                    th, td { border: 1px solid #e2e8f0 !important; padding: 12px !important; color: #0f172a !important; }
                    th { background-color: #f8fafc !important; font-weight: bold !important; }
                    /* Hide unnecessary buttons in the table */
                    button { display: none !important; }
                `}
            </style>

            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                
                {/* Header Section with Brand Colors and Geometric Accent */}
                <div className="relative bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm dark:shadow-none bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] dark:bg-[radial-gradient(#27313f_1px,transparent_1px)] [background-size:20px_20px]">
                    {/* Brand Line Accent */}
                    <div className="absolute top-0 right-0 left-0 h-1 rounded-t-3xl bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden rounded-3xl">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-primary-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-primary-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-primary-500" />
                            <circle cx="500" cy="160" r="6" className="fill-primary-400" />
                            <circle cx="750" cy="60" r="3" className="fill-primary-300" />
                        </svg>
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-2xl md:text-3xl font-black text-slate-800 dark:text-white tracking-tight">مُنشئ التقارير المخصصة</h1>
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">بناء تقارير ديناميكية وتصديرها فوراً</p>
                        </div>
                        
                        <div className="flex items-center gap-4 flex-wrap shrink-0">
                            {templates.length > 0 && (
                                <div className="relative" ref={templatesRef}>
                                    <button 
                                        onClick={() => setIsTemplatesOpen(!isTemplatesOpen)}
                                        className="flex items-center gap-2 bg-white/80 dark:bg-[#121820]/80 backdrop-blur border border-slate-200 dark:border-slate-800 px-4 py-3 rounded-2xl shadow-inner hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-sm font-bold text-slate-700 dark:text-slate-300"
                                    >
                                        <Bookmark size={18} className="text-primary-500" />
                                        <span>قوالبي المحفوظة...</span>
                                        <ChevronDown size={16} className={`text-slate-400 transition-transform duration-300 ${isTemplatesOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    
                                    {isTemplatesOpen && (
                                        <div className="absolute top-full right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-scale-in origin-top-right">
                                            <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                                                {templates.map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => {
                                                            loadTemplate({ target: { value: t.id }});
                                                            setIsTemplatesOpen(false);
                                                        }}
                                                        className="w-full text-right px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-700 dark:hover:text-primary-400 rounded-xl transition-colors flex items-center justify-between group"
                                                    >
                                                        <span>{t.name}</span>
                                                        <FileText size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                            <Link href={route('reports.center')} className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-[#121820] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-200 dark:hover:border-primary-500/30 rounded-2xl hover:shadow-lg hover:shadow-primary-500/5 text-sm font-bold transition-all shrink-0 active:scale-95">
                                <span>العودة للمركز</span>
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-8 relative">
                        
                    {/* 1. Entity Selection (Data Source) */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Users size={20} className="text-primary-500" />
                            <span>مصدر البيانات</span>
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className={`p-4 rounded-xl border transition-all ${entity === 'teachers' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300'}`}>
                                <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                                    <div className={`p-2 rounded-lg ${entity === 'teachers' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        <Users size={18} />
                                    </div>
                                    <span className="font-bold text-sm">المعلمين</span>
                                </div>
                                {entity === 'teachers' ? (
                                    <Select
                                        isMulti
                                        placeholder="بحث عن معلم..."
                                        noOptionsMessage={() => "لا يوجد نتائج"}
                                        options={teachersList.map(u => ({ value: u.name, label: u.name }))}
                                        value={
                                            entity === 'teachers' && filters.find(f => f.field === 'name') 
                                            ? (Array.isArray(filters.find(f => f.field === 'name').value) 
                                                ? filters.find(f => f.field === 'name').value.map(name => ({ value: name, label: name }))
                                                : [{ value: filters.find(f => f.field === 'name').value, label: filters.find(f => f.field === 'name').value }])
                                            : []
                                        }
                                        onChange={(selected) => {
                                            const names = selected ? selected.map(s => s.value) : [];
                                            handleEntitySelect('teachers', names.length > 0 ? names : 'all');
                                        }}
                                        className="text-sm"
                                        unstyled={true}
                                        classNames={customSelectClassNames}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                                    />
                                ) : (
                                    <button 
                                        onClick={() => handleEntitySelect('teachers', 'all')}
                                        className="w-full text-sm font-medium text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        اختر المعلمين
                                    </button>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl border transition-all ${entity === 'students' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300'}`}>
                                <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                                    <div className={`p-2 rounded-lg ${entity === 'students' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        <GraduationCap size={18} />
                                    </div>
                                    <span className="font-bold text-sm">الطلاب</span>
                                </div>
                                {entity === 'students' ? (
                                    <div className="space-y-2 mt-2">
                                        <Select
                                            isMulti
                                            placeholder="اختر الصفوف (أو اتركه للكل)..."
                                            noOptionsMessage={() => "لا يوجد صفوف"}
                                            options={gradesList.map(g => ({ value: g.id, label: g.name }))}
                                            value={gradesList.filter(g => selectedGrade.includes(g.id)).map(g => ({ value: g.id, label: g.name }))}
                                            onChange={(selected) => {
                                                const ids = selected ? selected.map(s => s.value) : [];
                                                setSelectedGrade(ids);
                                                setSelectedDivision([]);
                                                if (ids.length > 0) {
                                                    setFilters([{ id: Date.now(), field: 'grade_id', operator: '=', value: ids, logic: 'and' }]);
                                                } else {
                                                    setFilters([]);
                                                }
                                            }}
                                            className="text-xs"
                                            unstyled={true}
                                            classNames={customSelectClassNames}
                                            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                            styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                                        />

                                        {selectedGrade.length > 0 && (
                                            <Select
                                                isMulti
                                                placeholder="اختر الشعب (أو اتركه لكافة شعب الصفوف المحددة)..."
                                                noOptionsMessage={() => "لا يوجد شعب"}
                                                options={gradesList.filter(g => selectedGrade.includes(g.id)).flatMap(g => g.divisions || []).map(d => ({ value: d.id, label: d.name }))}
                                                value={gradesList.filter(g => selectedGrade.includes(g.id)).flatMap(g => g.divisions || []).filter(d => selectedDivision.includes(d.id)).map(d => ({ value: d.id, label: d.name }))}
                                                onChange={(selected) => {
                                                    const ids = selected ? selected.map(s => s.value) : [];
                                                    setSelectedDivision(ids);
                                                    if (ids.length > 0) {
                                                        setFilters([{ id: Date.now(), field: 'division_id', operator: '=', value: ids, logic: 'and' }]);
                                                    } else {
                                                        // Fallback to grades filter
                                                        setFilters([{ id: Date.now(), field: 'grade_id', operator: '=', value: selectedGrade, logic: 'and' }]);
                                                    }
                                                }}
                                                className="text-xs mt-2"
                                                unstyled={true}
                                                classNames={customSelectClassNames}
                                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                                            />
                                        )}

                                        {selectedDivision.length > 0 && (
                                            <Select
                                                isMulti
                                                placeholder="اختر طلاب محددين (أو اتركه لكافة الشعبة)..."
                                                noOptionsMessage={() => "لا يوجد طلاب"}
                                                options={studentsList.filter(s => selectedDivision.includes(s.division_id)).map(u => ({ value: u.name, label: u.name }))}
                                                value={
                                                    filters.find(f => f.field === 'name') 
                                                    ? (Array.isArray(filters.find(f => f.field === 'name').value) 
                                                        ? filters.find(f => f.field === 'name').value.map(name => ({ value: name, label: name }))
                                                        : [{ value: filters.find(f => f.field === 'name').value, label: filters.find(f => f.field === 'name').value }])
                                                    : []
                                                }
                                                onChange={(selected) => {
                                                    const names = selected ? selected.map(s => s.value) : [];
                                                    if (names.length === 0) {
                                                        setFilters([{ id: Date.now(), field: 'division_id', operator: '=', value: selectedDivision, logic: 'and' }]);
                                                        toast.success(`تم تخصيص التقرير لكافة طلاب الشعب المحددة`);
                                                    } else {
                                                        setFilters([{ id: Date.now(), field: 'name', operator: '=', value: names, logic: 'and' }]);
                                                        toast.success(`تم تخصيص التقرير للطلاب المحددين`);
                                                    }
                                                }}
                                                className="text-xs mt-2"
                                                unstyled={true}
                                                classNames={customSelectClassNames}
                                                menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                                styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                                            />
                                        )}
                                    </div>
                                ) : (
                                    <button 
                                        onClick={() => handleEntitySelect('students', 'all')}
                                        className="w-full mt-2 text-sm font-medium text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        اختر الطلاب
                                    </button>
                                )}
                            </div>

                            <div className={`p-4 rounded-xl border transition-all ${entity === 'supervisors' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-md shadow-primary-500/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300'}`}>
                                <div className="flex items-center gap-2 mb-3 text-slate-700 dark:text-slate-300">
                                    <div className={`p-2 rounded-lg ${entity === 'supervisors' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        <ShieldCheck size={18} />
                                    </div>
                                    <span className="font-bold text-sm">المشرفين</span>
                                </div>
                                {entity === 'supervisors' ? (
                                    <Select
                                        isMulti
                                        placeholder="ابحث عن مشرف..."
                                        noOptionsMessage={() => "لا يوجد مشرفين"}
                                        options={supervisorsList.map(u => ({ value: u.name, label: u.name }))}
                                        value={
                                            filters.find(f => f.field === 'name') 
                                            ? (Array.isArray(filters.find(f => f.field === 'name').value) 
                                                ? filters.find(f => f.field === 'name').value.map(name => ({ value: name, label: name }))
                                                : [{ value: filters.find(f => f.field === 'name').value, label: filters.find(f => f.field === 'name').value }])
                                            : []
                                        }
                                        onChange={(selected) => {
                                            const names = selected ? selected.map(s => s.value) : [];
                                            handleEntitySelect('supervisors', names.length > 0 ? names : 'all');
                                        }}
                                        className="text-sm"
                                        unstyled={true}
                                        classNames={customSelectClassNames}
                                        menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
                                        styles={{ menuPortal: base => ({ ...base, zIndex: 60 }) }}
                                    />
                                ) : (
                                    <button 
                                        onClick={() => handleEntitySelect('supervisors', 'all')}
                                        className="w-full text-sm font-medium text-center py-2 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/30 text-slate-600 dark:text-slate-300 transition-colors"
                                    >
                                        اختر المشرفين
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 2. Configuration Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Column 1: Date Range Selection */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Calendar size={20} className="text-emerald-500" />
                                    <span>الفترة الزمنية</span>
                                </h3>
                                <div className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">اختياري</div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                <button onClick={() => setQuickDate('today')} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">اليوم</button>
                                <button onClick={() => setQuickDate('week')} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">هذا الأسبوع</button>
                                <button onClick={() => setQuickDate('month')} className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 transition-colors">هذا الشهر</button>
                                <button onClick={() => setQuickDate('all')} className="text-xs px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 transition-colors">إلغاء التحديد</button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-auto">
                                <div className="group">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div>
                                        بداية الفترة
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={startDate} 
                                            onChange={e => setStartDate(e.target.value)} 
                                            className="w-full h-[42px] px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 shadow-sm transition-all duration-300 hover:border-emerald-300 hover:bg-white dark:hover:bg-slate-800" 
                                        />
                                    </div>
                                </div>
                                <div className="group">
                                    <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div>
                                        نهاية الفترة
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type="date" 
                                            value={endDate} 
                                            onChange={e => setEndDate(e.target.value)} 
                                            className="w-full h-[42px] px-4 rounded-xl border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sm font-medium text-slate-700 dark:text-slate-200 focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 shadow-sm transition-all duration-300 hover:border-rose-300 hover:bg-white dark:hover:bg-slate-800" 
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Advanced Filters */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Filter size={20} className="text-primary-500" />
                                    <span>الفلاتر المتقدمة</span>
                                </h3>
                                <button 
                                    onClick={addFilter}
                                    className="text-xs bg-primary-500 text-white hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 px-4 py-2 rounded-full flex items-center gap-1.5 font-bold transition-all shadow-sm hover:shadow-md"
                                >
                                    <Plus size={14} strokeWidth={3} />
                                    <span>إضافة شرط</span>
                                </button>
                            </div>
                            
                            {filters.length === 0 ? (
                                <p className="text-sm text-slate-400 text-center py-2">لا توجد شروط مخصصة، سيتم عرض جميع البيانات</p>
                            ) : (
                                <div className="space-y-3">
                                    {filters.map((filter, index) => (
                                        <React.Fragment key={filter.id}>
                                            {index > 0 && (
                                                <div className="flex justify-center -my-3 relative z-10">
                                                    <select
                                                        value={filter.logic || 'and'}
                                                        onChange={e => updateFilter(filter.id, 'logic', e.target.value)}
                                                        className="text-[11px] bg-primary-50 dark:bg-primary-900/50 text-primary-600 dark:text-primary-300 font-bold rounded-lg px-3 py-0.5 border-4 border-white dark:border-slate-900 focus:ring-0 cursor-pointer shadow-sm transition-colors text-center"
                                                    >
                                                        <option value="and">وَ (AND)</option>
                                                        <option value="or">أو (OR)</option>
                                                    </select>
                                                </div>
                                            )}
                                            <div className="flex flex-col sm:flex-row gap-2 bg-slate-50/50 dark:bg-slate-800/30 p-2.5 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 shadow-sm hover:border-primary-200 dark:hover:border-primary-900/50 transition-colors">
                                                <div className="flex-1 flex gap-2">
                                                    <select 
                                                        value={filter.field} 
                                                        onChange={e => updateFilter(filter.id, 'field', e.target.value)}
                                                        className="flex-1 min-w-[120px] text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 py-2 transition-all shadow-sm"
                                                    >
                                                        {availableFields.map(f => (
                                                            <option key={f.id} value={f.id}>{f.label}</option>
                                                        ))}
                                                    </select>
                                                    <select 
                                                        value={filter.operator} 
                                                        onChange={e => updateFilter(filter.id, 'operator', e.target.value)}
                                                        className="w-[80px] text-xs font-bold text-center rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 py-2 transition-all shadow-sm"
                                                    >
                                                        <option value="=">=</option>
                                                        <option value=">">&gt;</option>
                                                        <option value="<">&lt;</option>
                                                        <option value="like">يحتوي</option>
                                                    </select>
                                                </div>
                                                <div className="flex-1 flex gap-2">
                                                    <input 
                                                        type={getInputType(filter.field)} 
                                                        placeholder="أدخل القيمة..."
                                                        value={filter.value}
                                                        onChange={e => updateFilter(filter.id, 'value', e.target.value)}
                                                        className="flex-1 w-full text-xs font-medium rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 py-2 transition-all shadow-sm"
                                                    />
                                                    <button 
                                                        onClick={() => removeFilter(filter.id)}
                                                        className="p-2 w-[38px] flex-shrink-0 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-500 dark:hover:bg-rose-900/30 dark:hover:border-rose-900/50 rounded-xl transition-all shadow-sm"
                                                        title="حذف الشرط"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </React.Fragment>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>

                    {/* 3. Fields Selection (Horizontal Full Width) */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <CheckSquare size={20} className="text-primary-500" />
                                <span>الحقول المطلوبة</span>
                            </h3>
                            <p className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-700 font-medium flex items-center gap-1">
                                <GripVertical size={14} className="opacity-50" />
                                اسحب الحقول أفقياً لترتيبها
                            </p>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50/80 dark:bg-slate-800/40 rounded-2xl border border-slate-200/60 dark:border-slate-700/60 min-h-[90px] shadow-inner">
                            {availableFields.map((field, index) => (
                                <div 
                                    key={field.id}
                                    draggable
                                    onDragStart={(e) => (dragItem.current = index)}
                                    onDragEnter={(e) => (dragOverItem.current = index)}
                                    onDragEnd={handleSort}
                                    onClick={() => toggleField(field.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full cursor-pointer transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 active:scale-95 select-none ${
                                        fields.includes(field.id) 
                                            ? 'bg-gradient-to-l from-primary-600 to-primary-500 text-white shadow-lg shadow-primary-500/25 border-none' 
                                            : 'bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-primary-300 hover:text-primary-600 shadow-sm'
                                    }`}
                                >
                                    <GripVertical size={16} className={`${fields.includes(field.id) ? 'text-white/60 hover:text-white' : 'text-slate-300 hover:text-slate-500'} cursor-grab active:cursor-grabbing transition-colors`} />
                                    {fields.includes(field.id) && <Check size={16} strokeWidth={3} className="text-white" />}
                                    <span className="font-bold text-sm tracking-wide">
                                        {field.label}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 3. Generate & Save Buttons */}
                    <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden mb-6">
                        {/* Background Decoration */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 dark:bg-primary-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none"></div>
                        
                        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
                            <div className="text-center lg:text-right">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">إجراءات التقرير</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">قم بمعاينة البيانات بناءً على الفلاتر المحددة، أو احفظ هذا الإعداد كقالب لاستخدامه لاحقاً.</p>
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
                                <button 
                                    onClick={saveTemplate}
                                    title="حفظ كقالب للوصول السريع"
                                    className="w-full sm:w-auto group bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-primary-500 dark:hover:border-primary-500 px-6 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-sm hover:shadow-primary-500/20 hover:-translate-y-1"
                                >
                                    <Save size={22} className="text-slate-400 group-hover:text-primary-500 transition-colors" />
                                    <span>حفظ القالب</span>
                                </button>
                                <button 
                                    onClick={() => generatePreview(1)}
                                    disabled={loading}
                                    className="w-full sm:w-auto relative group overflow-hidden bg-gradient-to-l from-primary-600 to-primary-500 hover:from-primary-500 hover:to-primary-400 text-white px-10 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-xl shadow-primary-500/30 hover:shadow-primary-500/50 hover:-translate-y-1 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-primary-500/30"
                                >
                                    <div className="absolute inset-0 w-full h-full bg-white/20 transform -translate-x-full group-hover:translate-x-full transition-transform duration-500 ease-out skew-x-12"></div>
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>جاري المعالجة...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FileText size={22} />
                                            <span>جلب ومعاينة البيانات</span>
                                            <ArrowRight size={20} className="mr-1 group-hover:-translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 4. Grouping & Preview */}

                        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
                            
                            {/* Grouping */}
                            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 px-6 pb-2">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 rounded-lg bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                            <Layers size={18} />
                                        </div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">نمط العرض والتجميع (Grouping)</h3>
                                    </div>
                                </div>
                                
                                <div className="flex p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl shadow-inner">
                                    <button
                                        onClick={() => setGroupBy('')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            groupBy === '' 
                                                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <List size={18} />
                                        <span>عرض تفصيلي (سجلات)</span>
                                    </button>
                                    <button
                                        onClick={() => setGroupBy(entity === 'students' ? 'grade' : 'department')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all duration-300 ${
                                            groupBy !== '' 
                                                ? 'bg-white dark:bg-slate-900 text-primary-600 dark:text-primary-400 shadow-sm' 
                                                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                                        }`}
                                    >
                                        <PieChart size={18} />
                                        <span>تجميع إحصائي حسب ({entity === 'students' ? 'الصف' : 'القسم'})</span>
                                    </button>
                                </div>
                            </div>

                            {/* Export Header */}
                            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
                                        <Eye size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">المعاينة المسبقة</h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">شكل التقرير النهائي قبل التصدير</p>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={exportToPDF}
                                        disabled={results.length === 0}
                                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/50 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        <Download size={18} />
                                        <span>تصدير PDF</span>
                                    </button>
                                    <button 
                                        onClick={exportToExcel}
                                        disabled={results.length === 0}
                                        className="px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-200 dark:hover:border-emerald-900/50 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:hover:bg-white"
                                    >
                                        <Download size={18} />
                                        <span>تصدير Excel</span>
                                    </button>
                                </div>
                            </div>

                            {/* Table Content */}
                            <div className="p-6 flex-1 overflow-auto bg-slate-50/50 dark:bg-[#0f172a]">
                                {results.length === 0 ? (
                                    <div className="h-[400px] flex flex-col items-center justify-center text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-700 m-2">
                                        <div className="w-24 h-24 mb-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center shadow-inner">
                                            <FileText size={48} className="text-slate-300 dark:text-slate-600" />
                                        </div>
                                        <h4 className="text-lg font-bold text-slate-600 dark:text-slate-300 mb-2">لا توجد بيانات للعرض</h4>
                                        <p className="text-sm text-center max-w-md leading-relaxed">حدد الخيارات المطلوبة من الأعلى واضغط على زر <br/> "جلب ومعاينة البيانات" لإنشاء التقرير الخاص بك.</p>
                                    </div>
                                ) : (
                                    <div id="report-table-container" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm" dir="rtl">
                                        <div className="p-6 border-b border-slate-200 dark:border-slate-700 text-center font-bold text-xl hidden print:block text-slate-800">
                                            تقرير {
                                                entity === 'teachers' ? 'المعلمين' : 
                                                entity === 'supervisors' ? 'المشرفين' :
                                                entity === 'employees' ? 'الموظفين' :
                                                'الطلاب'
                                            }
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-right">
                                                <thead>
                                                    <tr className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-sm">
                                                        {columns.map((col, i) => (
                                                            <th key={i} className="px-6 py-4 font-bold border-b border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                                {col}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {results.map((row, i) => (
                                                        <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-colors group">
                                                            {columns.map((col, j) => (
                                                                <td key={j} className="px-6 py-4 text-slate-700 dark:text-slate-300 text-sm font-medium">
                                                                    {row[col]}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Pagination */}
                            {paginationMeta && (
                                <div className="p-4 px-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                        إجمالي السجلات: <span className="font-bold text-slate-800 dark:text-white px-1">{paginationMeta.total}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <button 
                                            onClick={() => handlePageChange(page - 1)}
                                            disabled={page === 1}
                                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                        <div className="text-xs font-bold text-slate-600 dark:text-slate-300 px-4 min-w-[100px] text-center">
                                            {page} / {paginationMeta.last_page}
                                        </div>
                                        <button 
                                            onClick={() => handlePageChange(page + 1)}
                                            disabled={page === paginationMeta.last_page}
                                            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                                        >
                                            <ChevronLeft size={18} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
        </AdminLayout>
    );
}
