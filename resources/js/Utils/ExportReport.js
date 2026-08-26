export const exportReportToPDF = () => {
    // We use native browser printing for PDF to prevent freezing and ensure 100% accurate RTL support.
    // The CSS in Review.jsx (@media print) handles hiding everything except the report.
    window.print();
};

export const exportReportToExcel = async (report, logoUrl = null) => {
    try {
        const ExcelJS = (await import('exceljs')).default || await import('exceljs');
        const { saveAs } = await import('file-saver');

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Smart-School System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('التقرير الإداري', {
            views: [{ rightToLeft: true, state: 'frozen', ySplit: 5 }],
            pageSetup: {
                paperSize: 9,
                orientation: 'landscape',
                fitToPage: true,
                fitToWidth: 1,
                fitToHeight: 0,
                margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 }
            },
            headerFooter: {
                oddFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - النظام الإداري',
                evenFooter: '&Rتاريخ الطباعة: &D &T&Cالصفحة &P من &N&Lمدارس القيم الأهلية - النظام الإداري'
            }
        });

        // ─── LOGO FETCHING ───
        let logoId = null;
        const logoPath = logoUrl || '/images/logo.png';
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

        // ─── COLUMNS LAYOUT ───
        sheet.columns = [
            { width: 15 },
            { width: 25 },
            { width: 25 },
            { width: 10 },
            { width: 20 },
            { width: 20 },
            { width: 15 }
        ];

        // ─── TOP ACCENT BAR ───
        sheet.getRow(1).height = 10;
        sheet.mergeCells('A1:G1');
        sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };

        // ─── HEADER SECTION ───
        sheet.getRow(2).height = 35;
        sheet.getRow(3).height = 25;
        sheet.getRow(4).height = 20;

        if (logoId !== null) {
            sheet.addImage(logoId, { tl: { col: 3.3, row: 1.1 }, ext: { width: 85, height: 85 } });
        }

        // Title
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

        // Reference
        sheet.mergeCells('A4:C4');
        const subTitleCell = sheet.getCell('A4');
        subTitleCell.value = `النظام الإداري - ${report.template?.name || 'تقرير'}`;
        subTitleCell.font = { name: 'Segoe UI', size: 12, bold: true, color: { argb: 'FFE32636' } }; 
        subTitleCell.alignment = { horizontal: 'right', vertical: 'middle' };

        // Meta Data (Left Side)
        sheet.mergeCells('E2:G2');
        const meta1Cell = sheet.getCell('E2');
        meta1Cell.value = `مُقدّم التقرير: ${report.submitter?.name || '-'} (${report.submitter?.employee?.job_grade?.name || '-'})`;
        meta1Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        meta1Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        const exportDate = new Date().toLocaleString('ar-EG');
        sheet.mergeCells('E3:G3');
        const meta2Cell = sheet.getCell('E3');
        meta2Cell.value = `تاريخ التصدير: ${exportDate}`;
        meta2Cell.font = { size: 10, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
        meta2Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.mergeCells('E4:G4');
        const meta3Cell = sheet.getCell('E4');
        const statusText = report.status === 'reviewed' ? 'معتمد ✔' : (report.status === 'returned' ? 'مُعاد ✘' : 'قيد المراجعة ⏳');
        const statusColor = report.status === 'reviewed' ? 'FF6B9B37' : (report.status === 'returned' ? 'FFE32636' : 'FFD97706');
        meta3Cell.value = `حالة التقرير: ${statusText}`;
        meta3Cell.font = { size: 11, bold: true, color: { argb: statusColor }, name: 'Segoe UI' };
        meta3Cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

        sheet.getRow(5).height = 15; // Spacer

        sheet.getRow(7).height = 30;
        sheet.mergeCells('A7:G7');
        const statsCell = sheet.getCell('A7');
        statsCell.value = `📄 الرقم المرجعي: REF-${report.id.toString().padStart(6, '0')}   |   📅 تاريخ التقديم: ${new Date(report.created_at).toLocaleDateString('ar-EG')}   |   ✅ اعتماد: ${report.reviewer?.name || 'لم يعتمد بعد'}`;
        statsCell.font = { size: 11, bold: true, color: { argb: 'FF437020' }, name: 'Segoe UI' };
        statsCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        statsCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0F7EB' } };
        statsCell.border = { top: { style: 'medium', color: { argb: 'FF96CF75' } }, bottom: { style: 'medium', color: { argb: 'FF96CF75' } }, left: { style: 'medium', color: { argb: 'FF96CF75' } }, right: { style: 'medium', color: { argb: 'FF96CF75' } } };

        sheet.getRow(8).height = 10;

        // ─── DATA FIELDS ───
        if (report.template?.fields && report.data) {
            const sortedFields = [...report.template.fields].sort((a, b) => a.order - b.order);
            
            let currentRow = 9;
            let counter = 1;

            for (const field of sortedFields) {
                const value = report.data[field.name];
                
                // Field Title Row
                const fieldHeader = sheet.getRow(currentRow);
                fieldHeader.height = 30;
                sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                
                const hc = fieldHeader.getCell(1);
                hc.value = `${counter}. ${field.name}`;
                hc.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
                hc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
                hc.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
                hc.border = { top: { style: 'thin', color: { argb: 'FFFFFFFF' } }, left: { style: 'thin', color: { argb: 'FFFFFFFF' } }, bottom: { style: 'thin', color: { argb: 'FFFFFFFF' } }, right: { style: 'thin', color: { argb: 'FFFFFFFF' } } };
                currentRow++;

                if (value === null || value === undefined || value === '') {
                    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                    const valCell = sheet.getCell(`A${currentRow}`);
                    valCell.value = 'لم يتم إدخال بيانات';
                    valCell.font = { italic: true, color: { argb: 'FF94A3B8' } };
                    valCell.alignment = { horizontal: 'center', vertical: 'middle' };
                    valCell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    currentRow += 2;
                    counter++;
                    continue;
                }

                if (field.type === 'matrix_text' && Array.isArray(value)) {
                    let columns = [];
                    try {
                        if (typeof field.options === 'string') {
                            columns = field.options.split('.').map(s => s.trim()).filter(Boolean);
                        } else if (Array.isArray(field.options)) {
                            columns = field.options.join('.').split('.').map(s => s.trim()).filter(Boolean);
                        }
                    } catch (e) {}

                    const headers = ['اليوم', ...columns];
                    const hr = sheet.getRow(currentRow);
                    hr.values = headers;
                    hr.font = { bold: true, name: 'Segoe UI', color: { argb: 'FF1E293B' } };
                    hr.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                        cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
                        cell.alignment = { horizontal: 'center' };
                    });
                    currentRow++;

                    value.forEach((row, idx) => {
                        const rowData = [row.day || '-'];
                        columns.forEach(col => rowData.push(row[col] || '-'));
                        const vr = sheet.getRow(currentRow);
                        vr.values = rowData;
                        vr.eachCell(cell => {
                            cell.border = { top: {style:'thin', color:{argb:'FFE2E8F0'}}, bottom: {style:'thin', color:{argb:'FFE2E8F0'}}, left: {style:'thin', color:{argb:'FFE2E8F0'}}, right: {style:'thin', color:{argb:'FFE2E8F0'}} };
                            cell.alignment = { horizontal: 'center', wrapText: true };
                            if(idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                        });
                        currentRow++;
                    });
                } else if (field.type === 'tasks_matrix' && typeof value === 'object') {
                    const hr = sheet.getRow(currentRow);
                    hr.values = ['الأعمال', 'الحالة', 'السبب (إن لم ينفذ)'];
                    hr.font = { bold: true, name: 'Segoe UI', color: { argb: 'FF1E293B' } };
                    hr.eachCell(cell => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                        cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
                    });
                    currentRow++;

                    Object.entries(value).forEach(([key, val], idx) => {
                        const statusText = val.status === 'executed' ? 'نفذ ✔' : (val.status === 'not_executed' ? 'لم ينفذ ✘' : '-');
                        const vr = sheet.getRow(currentRow);
                        vr.values = [key, statusText, val.reason || '-'];
                        vr.getCell(2).font = { bold: true, color: val.status === 'executed' ? {argb:'FF16A34A'} : {argb:'FFE2202C'} };
                        vr.eachCell(cell => {
                            cell.border = { top: {style:'thin', color:{argb:'FFE2E8F0'}}, bottom: {style:'thin', color:{argb:'FFE2E8F0'}}, left: {style:'thin', color:{argb:'FFE2E8F0'}}, right: {style:'thin', color:{argb:'FFE2E8F0'}} };
                            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                            if(idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                        });
                        currentRow++;
                    });
                } else if (field.type === 'data_source' && Array.isArray(value)) {
                    if (value.length === 0) {
                        sheet.mergeCells(`A${currentRow}:D${currentRow}`);
                        sheet.getCell(`A${currentRow}`).value = 'لا توجد بيانات مسحوبة.';
                        currentRow++;
                    } else {
                        const options = typeof field.options === 'string' ? JSON.parse(field.options) : (field.options || {});
                        const columns = options.columns || [];
                        const columnHeaders = { day: 'اليوم', date: 'التاريخ', teacher_name: 'اسم المعلم', visit_type: 'نوع الزيارة', notes: 'الملاحظات والتوصيات', evaluation: 'التقييم', discussed_points: 'نقاط النقاش' };
                        
                        const headers = columns.map(col => columnHeaders[col] || col);
                        const hr = sheet.getRow(currentRow);
                        hr.values = headers;
                        hr.font = { bold: true, name: 'Segoe UI', color: { argb: 'FF1E293B' } };
                        hr.eachCell(cell => {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                            cell.border = { top: {style:'thin'}, bottom: {style:'thin'}, left: {style:'thin'}, right: {style:'thin'} };
                        });
                        currentRow++;

                        value.forEach((row, idx) => {
                            const rowData = columns.map(col => row[col] || '-');
                            const vr = sheet.getRow(currentRow);
                            vr.values = rowData;
                            vr.eachCell(cell => {
                                cell.border = { top: {style:'thin', color:{argb:'FFE2E8F0'}}, bottom: {style:'thin', color:{argb:'FFE2E8F0'}}, left: {style:'thin', color:{argb:'FFE2E8F0'}}, right: {style:'thin', color:{argb:'FFE2E8F0'}} };
                                cell.alignment = { horizontal: 'center', wrapText: true };
                                if(idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                            });
                            currentRow++;
                        });
                    }
                } else if (field.type === 'checkbox') {
                    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                    const valCell = sheet.getCell(`A${currentRow}`);
                    valCell.value = value ? 'نعم ✔' : 'لا ✘';
                    valCell.font = { bold: true, color: value ? { argb: 'FF558A2A' } : { argb: 'FFCC2B2B' }, name: 'Segoe UI', size: 11 };
                    valCell.alignment = { horizontal: 'right', indent: 1, vertical: 'middle' };
                    valCell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    valCell.fill = { type: 'pattern', pattern: 'solid', fgColor: value ? { argb: 'FFDCEFD1' } : { argb: 'FFFEF2F2' } };
                    sheet.getRow(currentRow).height = 30;
                    currentRow++;
                } else if (field.type === 'image' || field.type === 'file') {
                    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                    const valCell = sheet.getCell(`A${currentRow}`);
                    valCell.value = '(المرفق متوفر في النظام ويمكن استعراضه هناك)';
                    valCell.font = { italic: true, color: { argb: 'FF64748B' }, name: 'Segoe UI' };
                    valCell.alignment = { horizontal: 'right', indent: 1, vertical: 'middle' };
                    valCell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    currentRow++;
                } else {
                    const strVal = (typeof value === 'string' || typeof value === 'number') ? value.toString() : JSON.stringify(value);
                    sheet.mergeCells(`A${currentRow}:G${currentRow}`);
                    const valCell = sheet.getCell(`A${currentRow}`);
                    valCell.value = strVal.replace(/<[^>]+>/g, ''); 
                    valCell.alignment = { wrapText: true, vertical: 'middle', horizontal: 'right', indent: 1 };
                    valCell.font = { size: 11, color: { argb: 'FF212529' }, name: 'Segoe UI' };
                    valCell.border = { bottom: { style: 'thin', color: { argb: 'FFDEE2E6' } }, left: { style: 'thin', color: { argb: 'FFDEE2E6' } }, right: { style: 'thin', color: { argb: 'FFDEE2E6' } } };
                    sheet.getRow(currentRow).height = 40; // Expand for text
                    currentRow++;
                }
                
                sheet.getRow(currentRow).height = 15; // Spacer
                currentRow++;
                counter++;
            }
            
            // Signatures block
            currentRow++;
            sheet.mergeCells(`B${currentRow}:C${currentRow}`);
            sheet.mergeCells(`E${currentRow}:F${currentRow}`);
            sheet.getCell(`B${currentRow}`).value = 'توقيع مُعدّ التقرير';
            sheet.getCell(`E${currentRow}`).value = 'اعتماد المشرف / مدير المدرسة';
            sheet.getRow(currentRow).font = { bold: true, color: { argb: 'FF64748B' }, name: 'Segoe UI', size: 11 };
            sheet.getRow(currentRow).alignment = { horizontal: 'center', vertical: 'middle' };
            currentRow++;
            
            sheet.mergeCells(`B${currentRow}:C${currentRow}`);
            sheet.mergeCells(`E${currentRow}:F${currentRow}`);
            sheet.getCell(`B${currentRow}`).value = report.submitter?.name;
            sheet.getCell(`E${currentRow}`).value = report.reviewer?.name || '..................................';
            sheet.getRow(currentRow).font = { bold: true, size: 14, color: { argb: 'FF6B9B37' }, name: 'Segoe UI' };
            sheet.getRow(currentRow).alignment = { horizontal: 'center', vertical: 'middle' };
            currentRow++;
        }

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const safeName = (report.submitter?.name || 'موظف').replace(/\s+/g, '_');
        saveAs(blob, `تقرير_${safeName}_${new Date().getTime()}.xlsx`);
    } catch (error) {
        console.error("Excel generation error:", error);
    }
};
