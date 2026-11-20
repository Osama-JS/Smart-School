import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const FONT_NAME = 'Tahoma';

const OLIVE_DARK = 'FF4D7C0F';
const OLIVE_LIGHT = 'FFF7FBE9';
const OLIVE_ALT = 'FFF9FBF5';
const BORDER_COLOR = 'FFD4D4D8';
const CHARCOAL = 'FF18181B';

const STATUS_STYLES = {
    active_today: { fill: 'FFF7FBE9', text: 'FF4D7C0F' },
    inactive_7d:  { fill: 'FFFEF3C7', text: 'FFB45309' },
    ghost:        { fill: 'FFFEE2E2', text: 'FFDC2626' },
    previous:     { fill: 'FFF1F5F9', text: 'FF334155' },
};

function applyBorder(cell, color = BORDER_COLOR) {
    cell.border = {
        top: { style: 'thin', color: { argb: color } },
        left: { style: 'thin', color: { argb: color } },
        bottom: { style: 'thin', color: { argb: color } },
        right: { style: 'thin', color: { argb: color } },
    };
}

export async function exportEngagementExcel({ rows = [], meta = {}, stats = {}, charts = {} }) {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = meta.school_name || 'Smart-School';
    workbook.created = new Date();

    // ═══════════════════════════════════════════════════════════════
    // Sheet 1: سجل المستخدمين
    // ═══════════════════════════════════════════════════════════════
    const sheet = workbook.addWorksheet('سجل المستخدمين', {
        views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
        pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    });

    sheet.columns = [
        { key: 'index', width: 7 },
        { key: 'name', width: 28 },
        { key: 'username', width: 18 },
        { key: 'email', width: 26 },
        { key: 'phone', width: 16 },
        { key: 'role_name', width: 18 },
        { key: 'status_label', width: 20 },
        { key: 'today_logins', width: 13 },
        { key: 'total_logins', width: 14 },
        { key: 'last_login_at', width: 20 },
        { key: 'is_active', width: 13 },
    ];

    // Row 1: Main School Banner
    sheet.mergeCells('A1:K1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${meta.school_name || 'مدارس القيم الأهلية'} — تقرير سجل التفاعل والنشاط`;
    titleCell.font = { name: FONT_NAME, size: 15, bold: true, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: OLIVE_DARK } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 34;

    // Row 2: Metadata / Filter Info Bar
    sheet.mergeCells('A2:K2');
    const metaCell = sheet.getCell('A2');
    const branchLabel = meta.branch_name ? `الفرع: ${meta.branch_name}   |   ` : '';
    metaCell.value = `${branchLabel}التصنيف: ${meta.filter_label || 'الكل'}   |   عدد السجلات: ${rows.length}   |   تاريخ التصدير: ${meta.exported_at || ''}`;
    metaCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: OLIVE_DARK } };
    metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: OLIVE_LIGHT } };
    metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(2).height = 24;

    // Row 3: Spacer
    sheet.getRow(3).height = 8;

    // Row 4: Table Headers
    const headers = [
        '#',
        'الاسم الكامل',
        'اسم المستخدم',
        'البريد الإلكتروني',
        'رقم الجوال',
        'الدور الوظيفي',
        'حالة التفاعل',
        'دخول اليوم',
        'إجمالي الدخول',
        'آخر ظهور',
        'حالة الحساب',
    ];
    const headerRow = sheet.getRow(4);
    headerRow.height = 28;
    headers.forEach((h, i) => {
        const cell = headerRow.getCell(i + 1);
        cell.value = h;
        cell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CHARCOAL } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        applyBorder(cell, CHARCOAL);
    });

    sheet.autoFilter = { from: 'A4', to: 'K4' };

    // Data Rows
    rows.forEach((row, idx) => {
        const excelRow = sheet.addRow([
            idx + 1,
            row.name || '',
            row.username || '—',
            row.email || '—',
            row.phone || '—',
            row.role_name || 'غير محدد',
            row.status_label || '',
            Number(row.today_logins || 0),
            Number(row.total_logins || 0),
            row.last_login_at || 'لم يدخل أبداً',
            row.is_active || 'مفعّل',
        ]);

        excelRow.height = 23;
        const rowBg = idx % 2 === 0 ? 'FFFFFFFF' : OLIVE_ALT;

        excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
            cell.font = { name: FONT_NAME, size: 10, color: { argb: CHARCOAL } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowBg } };
            cell.alignment = {
                horizontal: colNumber === 2 || colNumber === 4 ? 'right' : 'center',
                vertical: 'middle',
            };
            applyBorder(cell);
        });

        // Bold name
        excelRow.getCell(2).font = { name: FONT_NAME, size: 10, bold: true, color: { argb: CHARCOAL } };

        // Status cell semantic styling
        const stStyle = STATUS_STYLES[row.status_key] || STATUS_STYLES.previous;
        const statusCell = excelRow.getCell(7);
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: stStyle.fill } };
        statusCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: stStyle.text } };

        // Account status styling
        const accCell = excelRow.getCell(11);
        if (row.is_active === 'معطّل') {
            accCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FFDC2626' } };
        } else {
            accCell.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: OLIVE_DARK } };
        }
    });

    // Totals Footer Row
    if (rows.length > 0) {
        const startRow = 5;
        const endRow = 4 + rows.length;
        const totalRow = sheet.addRow([
            '',
            `الإجمالي (${rows.length} مستخدم)`,
            '',
            '',
            '',
            '',
            '',
            { formula: `SUM(H${startRow}:H${endRow})` },
            { formula: `SUM(I${startRow}:I${endRow})` },
            '',
            '',
        ]);
        totalRow.height = 26;
        totalRow.eachCell({ includeEmpty: true }, (cell) => {
            cell.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: OLIVE_DARK } };
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: OLIVE_LIGHT } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            applyBorder(cell, OLIVE_DARK);
        });
    }

    // ═══════════════════════════════════════════════════════════════
    // Sheet 2: ملخص الإحصائيات
    // ═══════════════════════════════════════════════════════════════
    const summarySheet = workbook.addWorksheet('ملخص الإحصائيات', {
        views: [{ rightToLeft: true }],
    });
    summarySheet.columns = [
        { width: 30 },
        { width: 20 },
        { width: 6 },
        { width: 28 },
        { width: 18 },
    ];

    summarySheet.mergeCells('A1:E1');
    const sumTitle = summarySheet.getCell('A1');
    sumTitle.value = `ملخص مؤشرات التفاعل — ${meta.school_name || 'مدارس القيم الأهلية'}`;
    sumTitle.font = { name: FONT_NAME, size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    sumTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: OLIVE_DARK } };
    sumTitle.alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 32;

    summarySheet.getRow(2).height = 10;

    // KPI Section (Columns A-B)
    const kpiTitle = summarySheet.getCell('A3');
    kpiTitle.value = 'المؤشر العام';
    const kpiValHeader = summarySheet.getCell('B3');
    kpiValHeader.value = 'القيمة';
    [kpiTitle, kpiValHeader].forEach((c) => {
        c.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CHARCOAL } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(c, CHARCOAL);
    });
    summarySheet.getRow(3).height = 24;

    const totalUsers = Number(stats?.total_users || 0);
    const activeToday = Number(stats?.active_today || 0);
    const rate = totalUsers > 0 ? `${Math.round((activeToday / totalUsers) * 100)}%` : '0%';

    const kpiRows = [
        ['إجمالي الحسابات بالنظام', totalUsers],
        ['النشطون اليوم', activeToday],
        ['خاملون منذ +7 أيام', Number(stats?.inactive_7d || 0)],
        ['الأشباح (لم يدخلوا أبداً)', Number(stats?.ghosts || 0)],
        ['الأكثر تفاعلاً (+20 دخول)', Number(stats?.power_users || 0)],
        ['نسبة التفاعل اليوم', rate],
    ];

    kpiRows.forEach(([label, val], idx) => {
        const rIdx = 4 + idx;
        const r = summarySheet.getRow(rIdx);
        r.height = 22;
        const c1 = r.getCell(1);
        const c2 = r.getCell(2);
        c1.value = label;
        c2.value = val;
        c1.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: CHARCOAL } };
        c2.font = { name: FONT_NAME, size: 10.5, bold: true, color: { argb: OLIVE_DARK } };
        c1.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : OLIVE_ALT } };
        c2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: OLIVE_LIGHT } };
        c1.alignment = { horizontal: 'right', vertical: 'middle' };
        c2.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(c1);
        applyBorder(c2);
    });

    // Role Distribution Section (Columns D-E)
    const roleHeader1 = summarySheet.getCell('D3');
    roleHeader1.value = 'توزيع الحسابات حسب الدور';
    const roleHeader2 = summarySheet.getCell('E3');
    roleHeader2.value = 'عدد المستخدمين';
    [roleHeader1, roleHeader2].forEach((c) => {
        c.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: CHARCOAL } };
        c.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(c, CHARCOAL);
    });

    (charts?.roles || []).forEach((role, idx) => {
        const rIdx = 4 + idx;
        const r = summarySheet.getRow(rIdx);
        const c4 = r.getCell(4);
        const c5 = r.getCell(5);
        c4.value = role.name;
        c5.value = Number(role.value || 0);
        c4.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: CHARCOAL } };
        c5.font = { name: FONT_NAME, size: 10, bold: true, color: { argb: OLIVE_DARK } };
        c4.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : OLIVE_ALT } };
        c5.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFFFFFFF' : OLIVE_ALT } };
        c4.alignment = { horizontal: 'right', vertical: 'middle' };
        c5.alignment = { horizontal: 'center', vertical: 'middle' };
        applyBorder(c4);
        applyBorder(c5);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    saveAs(
        new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
        `سجل_التفاعل_والنشاط_${stamp}.xlsx`
    );
}
