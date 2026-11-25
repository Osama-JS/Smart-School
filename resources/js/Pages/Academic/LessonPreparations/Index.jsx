import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, useForm, router, usePage } from '@inertiajs/react';

import Pagination from '@/Components/Pagination';
import Modal from '@/Components/Modal';
import InputLabel from '@/Components/InputLabel';
import SelectInput from '@/Components/SelectInput';
import FlatpickrInput from '@/Components/FlatpickrInput';
import {
    BookOpen,
    Trash,
    Eye,
    Calendar,
    User,
    Filter,
    X,
    FileText,
    CheckSquare,
    AlignLeft,
    Info,
    Download,
    Target,
    Sparkles,
    Layers,
    Wrench,
    ClipboardCheck,
    Star,
    MessageSquare,
    BookMarked,
    Save,
    Clock,
    TrendingUp,
    Activity,
    Heart,
    Brain,
    Award,
    Paperclip,
    File,
} from 'lucide-react';
import ExcelJS from 'exceljs';
import Swal from 'sweetalert2';
import { getPrepLang, getProgressBadgeStyle, LESSON_PREP_LABELS } from '@/Utils/lessonPrepI18n';

export default function Index({ auth, preparations, teachers, grades, subjects, filters }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingPrep, setViewingPrep] = useState(null);
    const { logo_url } = usePage().props;

    const { delete: destroy } = useForm();
    const reviewForm = useForm({
        supervisor_rating: null,
        supervisor_notes: '',
    });

    const normalizeDate = (value) => {
        if (!value) return '-';
        return String(value).slice(0, 10);
    };

    const openModal = (preparation) => {
        setViewingPrep(preparation);
        reviewForm.clearErrors();
        reviewForm.setData({
            supervisor_rating: preparation.supervisor_rating || null,
            supervisor_notes: preparation.supervisor_notes || '',
        });
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setViewingPrep(null);
        reviewForm.reset();
        reviewForm.clearErrors();
    };

    const submitReview = (e) => {
        e.preventDefault();
        if (!viewingPrep) return;

        reviewForm.post(route('academic.lesson-preparations.review', viewingPrep.id), {
            preserveScroll: true,
            onSuccess: (page) => {
                const updated = page?.props?.preparations?.data?.find((p) => p.id === viewingPrep.id);
                if (updated) {
                    setViewingPrep(updated);
                }
                Swal.fire({
                    icon: 'success',
                    title: 'تم الحفظ',
                    text: 'تم حفظ تقييم وملاحظات الموجه بنجاح.',
                    timer: 1800,
                    showConfirmButton: false,
                });
            },
        });
    };

    const confirmDelete = (id) => {
        Swal.fire({
            title: 'هل أنت متأكد؟',
            text: 'لن تتمكن من التراجع عن هذا!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'نعم، احذف!',
            cancelButtonText: 'إلغاء',
        }).then((result) => {
            if (result.isConfirmed) {
                destroy(route('academic.lesson-preparations.destroy', id));
            }
        });
    };

    const handleFilterChange = (key, value) => {
        router.get(
            route('academic.lesson-preparations'),
            {
                ...filters,
                [key]: value,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const renderStars = (rating, lang = 'ar') => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-0.5" title={LESSON_PREP_LABELS[lang].ratingTooltip(rating)}>
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                    />
                ))}
            </div>
        );
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
            { width: 15 }, // A: تاريخ التنفيذ
            { width: 15 }, // B: الحصة
            { width: 12 }, // C: الحالة
            { width: 15 }, // D: اللغة
            { width: 22 }, // E: السير في المنهج
            { width: 24 }, // F: المعلم
            { width: 22 }, // G: الصف والشعبة
            { width: 18 }, // H: المادة
            { width: 22 }, // I: الوحدة الدراسية
            { width: 28 }, // J: عنوان الدرس
            { width: 14 }, // K: الصفحات
            { width: 30 }, // L: الأهداف التعليمية
            { width: 24 }, // M: التمهيد والتهيئة
            { width: 26 }, // N: استراتيجيات التدريس
            { width: 26 }, // O: الوسائل التعليمية
            { width: 26 }, // P: الأنشطة التعليمية
            { width: 24 }, // Q: القيمة السلوكية
            { width: 24 }, // R: المهارات المكتسبة
            { width: 34 }, // S: الشرح والتقويم والواجب
            { width: 24 }, // T: التعزيزات
            { width: 14 }, // U: عدد المرفقات
            { width: 30 }, // V: تقييم وملاحظات الموجه
        ];

        if (logoId !== null) {
            sheet.addImage(logoId, { tl: { col: 10, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        sheet.getRow(1).height = 10;
        sheet.mergeCells('A1:V1');
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

        sheet.mergeCells('A2:D2');
        const titleCell = sheet.getCell('A2');
        titleCell.value = 'مدارس القيم الأهلية';
        titleCell.font = { name: 'Segoe UI', size: 22, bold: true, color: { argb: 'FF6B9B37' } };
        titleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A3:D3');
        const enTitleCell = sheet.getCell('A3');
        enTitleCell.value = 'AL QIYAM CIVEL SCHOOLS';
        enTitleCell.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FF6B9B37' } };
        enTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('A4:D4');
        const subTitleCell = sheet.getCell('A4');
        subTitleCell.value = 'النظام الإداري - دفاتر التحضير ومتابعة الدروس';
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } };
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        sheet.mergeCells('S2:V2');
        const typeCell = sheet.getCell('S2');
        typeCell.value = 'نوع التقرير: سجل دفاتر التحضير التربوي';
        typeCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        typeCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const printDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells('S3:V3');
        const dateCell = sheet.getCell('S3');
        dateCell.value = `تاريخ التصدير: ${printDate}`;
        dateCell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        dateCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.mergeCells('S4:V4');
        const statusCell = sheet.getCell('S4');
        statusCell.value = 'حالة التقرير: معتمد ✔';
        statusCell.font = { size: 11, bold: true, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
        statusCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.getRow(5).height = 15;

        const headers = [
            'تاريخ التنفيذ',
            'الحصة',
            'الحالة',
            'اللغة',
            'السير في المنهج حسب الخطة',
            'المعلم',
            'الصف والشعبة',
            'المادة',
            'الوحدة الدراسية',
            'عنوان الدرس',
            'الصفحات',
            'الأهداف التعليمية',
            'التمهيد والتهيئة',
            'استراتيجيات التدريس',
            'الوسائل التعليمية',
            'الأنشطة التعليمية',
            'القيمة السلوكية',
            'المهارات المكتسبة',
            'الشرح والتقويم والواجب',
            'التعزيزات',
            'عدد المرفقات',
            'تقييم وملاحظات الموجه',
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
                right: { style: 'thin', color: { argb: 'FFFFFFFF' } },
            };
        });

        preparations.data.forEach((prep) => {
            const contentSummary = [
                prep.topics_covered ? `الشرح: ${prep.topics_covered}` : null,
                prep.assessment_methods ? `التقويم: ${prep.assessment_methods}` : null,
                prep.homework ? `الواجب: ${prep.homework}` : null,
            ]
                .filter(Boolean)
                .join('\n');

            const supervisorSummary = [
                prep.supervisor_rating ? `التقييم: ${prep.supervisor_rating}/5` : null,
                prep.supervisor_notes ? `الملاحظات: ${prep.supervisor_notes}` : null,
                prep.reviewer?.name ? `المراجع: ${prep.reviewer.name}` : null,
            ]
                .filter(Boolean)
                .join('\n');

            const attachmentsCount = Array.isArray(prep.attachments) ? prep.attachments.length : 0;

            const rowData = [
                normalizeDate(prep.preparation_date),
                prep.period?.period_name || '-',
                prep.status === 'published' ? 'منشور' : 'مسودة',
                prep.language === 'en' ? 'English (LTR)' : 'عربي (RTL)',
                prep.curriculum_progress || '-',
                prep.teacher?.name || '-',
                `${prep.grade?.name || '-'} ${prep.division ? `- ${prep.division.name}` : ''}`,
                prep.subject?.name || '-',
                prep.unit_title || '-',
                prep.lesson_title || '-',
                prep.page_numbers || '-',
                prep.learning_objectives || '-',
                prep.warm_up || '-',
                Array.isArray(prep.teaching_strategies) && prep.teaching_strategies.length > 0 ? prep.teaching_strategies.join('، ') : '-',
                Array.isArray(prep.educational_aids) && prep.educational_aids.length > 0 ? prep.educational_aids.join('، ') : '-',
                prep.educational_activities || '-',
                prep.behavioral_value || '-',
                prep.acquired_skills || '-',
                contentSummary || '-',
                prep.reinforcements || '-',
                attachmentsCount > 0 ? `${attachmentsCount} مرفق` : 'لا يوجد',
                supervisorSummary || '-',
            ];

            const row = sheet.addRow(rowData);
            row.height = 45;

            row.eachCell((cell) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF212529' } };
                cell.border = {
                    bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    left: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                    right: { style: 'thin', color: { argb: 'FFDEE2E6' } },
                };
            });
        });

        sheet.autoFilter = `A6:V${preparations.data.length + 6}`;
        sheet.views = [{ state: 'frozen', ySplit: 6, rightToLeft: true }];

        sheet.pageSetup = {
            paperSize: 9,
            orientation: 'landscape',
            fitToPage: true,
            fitToWidth: 1,
            fitToHeight: 0,
            margins: { left: 0.2, right: 0.2, top: 0.4, bottom: 0.4, header: 0.1, footer: 0.1 },
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
                            <p className="text-primary-700/80 dark:text-primary-300/80 mt-2 text-sm font-semibold">
                                مراجعة وتقييم دفاتر التحضير التربوية الخاصة بالمعلمين وتدوين ملاحظات التوجيه
                            </p>
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                            <div className="group flex flex-col">
                                <InputLabel value="المعلم" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={teachers.map((t) => ({ value: t.id, label: t.name }))}
                                    value={filters.teacher_id || ''}
                                    onChange={(v) => handleFilterChange('teacher_id', v || '')}
                                    placeholder="كل المعلمين"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="الصف" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={grades.map((g) => ({ value: g.id, label: g.name }))}
                                    value={filters.grade_id || ''}
                                    onChange={(v) => handleFilterChange('grade_id', v || '')}
                                    placeholder="كل الصفوف"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="المادة" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={subjects.map((s) => ({ value: s.id, label: s.name }))}
                                    value={filters.subject_id || ''}
                                    onChange={(v) => handleFilterChange('subject_id', v || '')}
                                    placeholder="كل المواد"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="لغة التحضير" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <SelectInput
                                    className="w-full"
                                    options={[
                                        { value: 'ar', label: 'عربي (RTL)' },
                                        { value: 'en', label: 'English (LTR)' },
                                    ]}
                                    value={filters.language || ''}
                                    onChange={(v) => handleFilterChange('language', v || '')}
                                    placeholder="الكل"
                                    isClearable
                                />
                            </div>
                            <div className="group flex flex-col">
                                <InputLabel value="تاريخ التنفيذ" className="mb-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider" />
                                <div className="mt-1 relative">
                                    <FlatpickrInput
                                        value={filters.date_range || ''}
                                        onChange={(val) => handleFilterChange('date_range', val)}
                                        options={{
                                            mode: 'range',
                                            dateFormat: 'Y-m-d',
                                        }}
                                        placeholder="من - إلى"
                                        className="w-full pl-10 !py-[11px] border-slate-200 focus:border-primary-500 focus:ring-primary-500 rounded-lg shadow-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-800">
                                <thead className="bg-gray-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">التاريخ والحصة</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">المعلم</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">الصف والمادة</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">الوحدة وعنوان الدرس</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">مراجعة التوجيه</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-slate-300 uppercase tracking-wider">الإجراءات</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-200 dark:divide-slate-800">
                                    {preparations.data.length > 0 ? (
                                        preparations.data.map((prep) => {
                                            const prepLang = getPrepLang(prep);
                                            const prepIsEn = prepLang === 'en';
                                            const pt = LESSON_PREP_LABELS[prepLang];

                                            return (
                                                <tr key={prep.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                        <div className="flex items-center gap-2 font-semibold" dir="ltr">
                                                            <Calendar className="w-4 h-4 text-slate-400" />
                                                            {normalizeDate(prep.preparation_date)}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <span
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                                                    prep.status === 'published'
                                                                        ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400'
                                                                        : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                                                                }`}
                                                            >
                                                                {prep.status === 'published' ? pt.statusPublished : pt.statusDraft}
                                                            </span>
                                                            {prepIsEn && (
                                                                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                                                                    EN
                                                                </span>
                                                            )}
                                                            {prep.period?.period_name && (
                                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300">
                                                                    {prep.period.period_name}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-500/20 flex items-center justify-center text-primary-700 dark:text-primary-300 font-bold">
                                                                {prep.teacher?.name?.charAt(0)}
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-900 dark:text-white">{prep.teacher?.name}</div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900 dark:text-white font-medium">{prep.subject?.name}</div>
                                                        <div className="text-xs text-gray-500 dark:text-slate-400">
                                                            {prep.grade?.name} {prep.division ? `- ${prep.division.name}` : ''}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div dir={prepIsEn ? 'ltr' : 'rtl'} className={prepIsEn ? 'text-left' : 'text-right'}>
                                                            {prep.unit_title && (
                                                                <div className="text-[11px] font-bold text-primary-600 dark:text-primary-400">{prep.unit_title}</div>
                                                            )}
                                                            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 line-clamp-1">{prep.lesson_title}</div>
                                                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                                                {prep.curriculum_progress && (
                                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getProgressBadgeStyle(prep.curriculum_progress)}`}>
                                                                        {prep.curriculum_progress}
                                                                    </span>
                                                                )}
                                                                {prep.page_numbers && (
                                                                    <span className="text-[11px] text-slate-400">{prep.page_numbers}</span>
                                                                )}
                                                                {Array.isArray(prep.attachments) && prep.attachments.length > 0 && (
                                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                                        <Paperclip size={10} />
                                                                        {pt.attachmentsCount(prep.attachments.length)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {prep.reviewed_at || prep.supervisor_rating || prep.supervisor_notes ? (
                                                            <div className="space-y-1">
                                                                {renderStars(prep.supervisor_rating, prepLang)}
                                                                {prep.supervisor_notes && (
                                                                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                                                        <MessageSquare size={11} />
                                                                        توجد ملاحظة توجيهية
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                                                                <Clock size={11} />
                                                                بانتظار المراجعة
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button
                                                                onClick={() => openModal(prep)}
                                                                className="px-3 h-8 flex items-center justify-center gap-1.5 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-300 hover:bg-primary-100 transition-colors text-xs font-bold"
                                                                title="عرض ومراجعة التحضير"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                <span>عرض ومراجعة</span>
                                                            </button>
                                                            {auth.permissions?.includes('إدارة دفاتر التحضير') && (
                                                                <button
                                                                    onClick={() => confirmDelete(prep.id)}
                                                                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-red-600 hover:bg-red-50 transition-colors"
                                                                    title="حذف"
                                                                >
                                                                    <Trash className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                                <BookOpen className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                                                لا توجد سجلات تحضير مطابقة للبحث
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {preparations.links && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                                <Pagination links={preparations.links} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* View & Supervisor Review Modal */}
            <Modal show={isModalOpen} onClose={closeModal} maxWidth="2xl">
                {viewingPrep && (() => {
                    const viewLang = getPrepLang(viewingPrep);
                    const viewIsEn = viewLang === 'en';
                    const vt = LESSON_PREP_LABELS[viewLang];

                    return (
                        <div
                            dir={viewIsEn ? 'ltr' : 'rtl'}
                            className={`relative bg-white dark:bg-[#121820] w-full max-h-[88vh] overflow-y-auto custom-scrollbar rounded-2xl ${viewIsEn ? 'text-left' : 'text-right'}`}
                        >
                            {/* Decorative Header Background */}
                            <div className="absolute top-0 right-0 left-0 h-36 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 dark:from-primary-800/60 dark:via-primary-900/60 dark:to-slate-900 overflow-hidden">
                                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
                                <div className="absolute top-5 -left-10 w-24 h-24 bg-primary-400/20 rounded-full blur-xl pointer-events-none"></div>
                            </div>

                            {/* Modal Header */}
                            <div className="relative px-6 pt-6 pb-5 flex justify-between items-start">
                                <div className="flex gap-4 items-center text-white">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20 shadow-lg shadow-black/10 shrink-0">
                                        <BookOpen className="w-7 h-7 text-white drop-shadow-md" />
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
                                                {viewingPrep.status === 'published' ? vt.statusPublished : vt.statusDraft}
                                            </span>
                                            {viewIsEn && (
                                                <span className="px-2 py-0.5 rounded-full bg-indigo-500/80 text-white text-[10px] font-black border border-white/20">
                                                    EN
                                                </span>
                                            )}
                                            <span className="px-2.5 py-0.5 rounded-full bg-black/20 text-white text-[10px] font-bold backdrop-blur-md border border-white/10 flex items-center gap-1" dir="ltr">
                                                <Calendar className="w-3 h-3" />
                                                {normalizeDate(viewingPrep.preparation_date)}
                                            </span>
                                            {viewingPrep.period?.period_name && (
                                                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold backdrop-blur-md border border-white/20">
                                                    {viewingPrep.period.period_name}
                                                </span>
                                            )}
                                        </div>
                                        <h2 className="text-xl font-black text-white tracking-tight drop-shadow-md">
                                            {vt.supervisorModalTitle}
                                        </h2>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur-md transition-all border border-white/10 shadow-sm shrink-0"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="relative px-6 pb-6 space-y-5">
                                {/* Meta Info Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 -mt-2">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-primary-500" />
                                            {vt.supervisorTeacherLabel}
                                        </p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingPrep.teacher?.name}</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <BookOpen className="w-3.5 h-3.5 text-purple-500" />
                                            {vt.supervisorSubjectLabel}
                                        </p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">{viewingPrep.subject?.name}</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                            <User className="w-3.5 h-3.5 text-orange-500" />
                                            {vt.viewGradeAndDivision}
                                        </p>
                                        <p className="text-sm font-black text-slate-800 dark:text-white line-clamp-1">
                                            {viewingPrep.grade?.name} {viewingPrep.division ? `- ${viewingPrep.division.name}` : ''}
                                        </p>
                                    </div>
                                </div>

                                {/* Unit, Lesson Title, Curriculum Progress & Page Numbers */}
                                <div className="bg-primary-50/50 dark:bg-primary-500/5 rounded-2xl p-5 border border-primary-100/50 dark:border-primary-500/10 shadow-sm space-y-2">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <h4 className="text-xs font-black text-primary-600 dark:text-primary-400 flex items-center gap-2">
                                            <AlignLeft className="w-4 h-4" />
                                            {vt.supervisorLessonMetaTitle}
                                        </h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {viewingPrep.curriculum_progress && (
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getProgressBadgeStyle(viewingPrep.curriculum_progress)}`}>
                                                    <TrendingUp size={12} />
                                                    {viewingPrep.curriculum_progress}
                                                </span>
                                            )}
                                            {viewingPrep.page_numbers && (
                                                <span className="px-3 py-1 rounded-full bg-white dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/70 dark:border-slate-700">
                                                    {viewingPrep.page_numbers}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    {viewingPrep.unit_title && (
                                        <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5">
                                            <BookMarked size={14} />
                                            {viewingPrep.unit_title}
                                        </div>
                                    )}
                                    <div className="text-slate-800 dark:text-slate-100 font-black text-base md:text-lg leading-relaxed">
                                        {viewingPrep.lesson_title}
                                    </div>
                                </div>

                                {/* Pedagogical Elements */}
                                {viewingPrep.learning_objectives && (
                                    <div className="bg-rose-50/40 dark:bg-rose-500/5 rounded-2xl p-5 border border-rose-100 dark:border-rose-500/20">
                                        <h4 className="text-xs font-black text-rose-600 dark:text-rose-400 mb-2.5 flex items-center gap-2">
                                            <Target className="w-4 h-4" />
                                            {vt.objectivesLabel}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.learning_objectives}
                                        </div>
                                    </div>
                                )}

                                {viewingPrep.warm_up && (
                                    <div className="bg-amber-50/40 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-100 dark:border-amber-500/20">
                                        <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-2">
                                            <Sparkles className="w-4 h-4" />
                                            {vt.warmUpLabel}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.warm_up}
                                        </div>
                                    </div>
                                )}

                                {/* Strategies & Aids */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <Layers className="w-4 h-4" />
                                            {vt.strategiesLabel}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.isArray(viewingPrep.teaching_strategies) && viewingPrep.teaching_strategies.length > 0 ? (
                                                viewingPrep.teaching_strategies.map((st, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-300 text-xs font-bold">
                                                        {st}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">{vt.notSelected}</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <Wrench className="w-4 h-4" />
                                            {vt.aidsLabel}
                                        </h4>
                                        <div className="flex flex-wrap gap-1.5">
                                            {Array.isArray(viewingPrep.educational_aids) && viewingPrep.educational_aids.length > 0 ? (
                                                viewingPrep.educational_aids.map((aid, idx) => (
                                                    <span key={idx} className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-300 text-xs font-bold">
                                                        {aid}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-slate-400 text-xs italic">{vt.notSelected}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Educational Activities */}
                                {viewingPrep.educational_activities && (
                                    <div className="bg-cyan-50/40 dark:bg-cyan-500/5 rounded-2xl p-5 border border-cyan-100 dark:border-cyan-500/20">
                                        <h4 className="text-xs font-black text-cyan-600 dark:text-cyan-400 mb-2.5 flex items-center gap-2">
                                            <Activity className="w-4 h-4" />
                                            {vt.activitiesLabel}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.educational_activities}
                                        </div>
                                    </div>
                                )}

                                {/* Behavioral Value & Acquired Skills */}
                                {(viewingPrep.behavioral_value || viewingPrep.acquired_skills) && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-pink-50/40 dark:bg-pink-500/5 rounded-2xl p-5 border border-pink-100 dark:border-pink-500/20">
                                            <h4 className="text-xs font-black text-pink-600 dark:text-pink-400 mb-2.5 flex items-center gap-2">
                                                <Heart className="w-4 h-4" />
                                                {vt.behavioralValueLabel}
                                            </h4>
                                            <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                {viewingPrep.behavioral_value || <span className="text-slate-400 italic">{vt.notSpecified}</span>}
                                            </div>
                                        </div>
                                        <div className="bg-violet-50/40 dark:bg-violet-500/5 rounded-2xl p-5 border border-violet-100 dark:border-violet-500/20">
                                            <h4 className="text-xs font-black text-violet-600 dark:text-violet-400 mb-2.5 flex items-center gap-2">
                                                <Brain className="w-4 h-4" />
                                                {vt.acquiredSkillsLabel}
                                            </h4>
                                            <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                                {viewingPrep.acquired_skills || <span className="text-slate-400 italic">{vt.notSpecified}</span>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Topics Covered & Assessment */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <CheckSquare className="w-4 h-4" />
                                            {vt.viewTopics}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.topics_covered ? viewingPrep.topics_covered : <span className="text-slate-400 italic">{vt.noTopicsDetails}</span>}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-teal-600 dark:text-teal-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <ClipboardCheck className="w-4 h-4" />
                                            {vt.viewAssessment}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.assessment_methods ? viewingPrep.assessment_methods : <span className="text-slate-400 italic">{vt.noAssessmentDetails}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Reinforcements */}
                                {viewingPrep.reinforcements && (
                                    <div className="bg-amber-50/40 dark:bg-amber-500/5 rounded-2xl p-5 border border-amber-100 dark:border-amber-500/20">
                                        <h4 className="text-xs font-black text-amber-600 dark:text-amber-400 mb-2.5 flex items-center gap-2">
                                            <Award className="w-4 h-4" />
                                            {vt.reinforcementsLabel}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.reinforcements}
                                        </div>
                                    </div>
                                )}

                                {/* Homework & Teacher Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <FileText className="w-4 h-4" />
                                            {vt.viewHomework}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.homework ? viewingPrep.homework : <span className="text-slate-400 italic">{vt.noHomework}</span>}
                                        </div>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm">
                                        <h4 className="text-xs font-black text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-700/50">
                                            <Info className="w-4 h-4" />
                                            {vt.viewNotes}
                                        </h4>
                                        <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {viewingPrep.notes ? viewingPrep.notes : <span className="text-slate-400 italic">{vt.noNotesExtra}</span>}
                                        </div>
                                    </div>
                                </div>

                                {/* Attachments */}
                                {Array.isArray(viewingPrep.attachments) && viewingPrep.attachments.length > 0 && (
                                    <div className="bg-indigo-50/40 dark:bg-indigo-500/5 rounded-2xl p-5 border border-indigo-100 dark:border-indigo-500/20 space-y-3">
                                        <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                            <Paperclip className="w-4 h-4" />
                                            {vt.attachmentsHeading(viewingPrep.attachments.length)}
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                            {viewingPrep.attachments.map((att, idx) => (
                                                <a
                                                    key={idx}
                                                    href={`/storage/${att.path}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center justify-between gap-2 bg-white dark:bg-slate-800 px-3.5 py-2.5 rounded-xl border border-indigo-100 dark:border-slate-700 hover:border-indigo-400 transition-colors"
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <File size={15} className="text-indigo-500 shrink-0" />
                                                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{att.name}</span>
                                                    </div>
                                                    <Download size={14} className="text-indigo-500 shrink-0" />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Supervisor Review Section */}
                                <form
                                    onSubmit={submitReview}
                                    className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 dark:from-amber-500/10 dark:to-slate-900 rounded-2xl p-5 border border-amber-200/80 dark:border-amber-500/20 space-y-4"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-amber-200/60 dark:border-amber-500/20">
                                        <h4 className="text-sm font-black text-amber-800 dark:text-amber-300 flex items-center gap-2">
                                            <MessageSquare className="w-4 h-4" />
                                            {vt.supervisorReviewHeading}
                                        </h4>
                                        {viewingPrep.reviewer?.name && (
                                            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                                                {vt.lastReview} {viewingPrep.reviewer.name}
                                                {viewingPrep.reviewed_at ? ` (${new Date(viewingPrep.reviewed_at).toLocaleString(viewIsEn ? 'en-US' : 'ar-EG')})` : ''}
                                            </span>
                                        )}
                                    </div>

                                    {/* Star Rating */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                                            {vt.supervisorRatingLabel}
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 px-3 py-2 rounded-xl border border-amber-200/70 dark:border-slate-700">
                                                {[1, 2, 3, 4, 5].map((star) => {
                                                    const active = (reviewForm.data.supervisor_rating || 0) >= star;
                                                    return (
                                                        <button
                                                            key={star}
                                                            type="button"
                                                            onClick={() => reviewForm.setData('supervisor_rating', star)}
                                                            className="p-1 transition-transform hover:scale-110"
                                                            title={vt.outOfFive(star)}
                                                        >
                                                            <Star
                                                                size={22}
                                                                className={active ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600'}
                                                            />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                            {reviewForm.data.supervisor_rating && (
                                                <button
                                                    type="button"
                                                    onClick={() => reviewForm.setData('supervisor_rating', null)}
                                                    className="text-xs font-bold text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                                                >
                                                    {vt.clearRating}
                                                </button>
                                            )}
                                        </div>
                                        {reviewForm.errors.supervisor_rating && (
                                            <p className="text-xs font-bold text-red-500">{reviewForm.errors.supervisor_rating}</p>
                                        )}
                                    </div>

                                    {/* Supervisor Notes */}
                                    <div className="space-y-1.5">
                                        <label className="block text-xs font-black text-slate-700 dark:text-slate-200">
                                            {vt.supervisorNotesLabel}
                                        </label>
                                        <textarea
                                            rows="3"
                                            dir="auto"
                                            value={reviewForm.data.supervisor_notes}
                                            onChange={(e) => reviewForm.setData('supervisor_notes', e.target.value)}
                                            placeholder={vt.supervisorNotesPlaceholder}
                                            className="w-full bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-slate-700 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 resize-y"
                                        ></textarea>
                                        {reviewForm.errors.supervisor_notes && (
                                            <p className="text-xs font-bold text-red-500">{reviewForm.errors.supervisor_notes}</p>
                                        )}
                                    </div>

                                    <div className="flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={reviewForm.processing}
                                            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-black flex items-center gap-2 shadow-sm transition-all disabled:opacity-50"
                                        >
                                            <Save size={16} />
                                            {vt.saveReviewBtn}
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* Modal Footer */}
                            <div className="sticky bottom-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-[#121820]/80 backdrop-blur-xl flex justify-end gap-3 z-20 rounded-b-2xl">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold transition-colors shadow-sm text-sm"
                                >
                                    {vt.close}
                                </button>
                            </div>
                        </div>
                    );
                })()}
            </Modal>
        </AdminLayout>
    );
}
