import ExcelJS from 'exceljs';
import dayjs from 'dayjs';

const EASTERN_ARABIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

export const toWesternDigits = (value) =>
    String(value ?? '').replace(/[٠-٩]/g, (d) => String(EASTERN_ARABIC_DIGITS.indexOf(d)));

export const normalizeArabicText = (str) =>
    toWesternDigits(str)
        .toLowerCase()
        .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/\s+/g, ' ')
        .trim();

const pad2 = (n) => String(n).padStart(2, '0');

const isValidYmd = (y, m, d) => {
    if (y < 1900 || y > 2100 || m < 1 || m > 12 || d < 1 || d > 31) return false;
    const probe = new Date(Date.UTC(y, m - 1, d));
    return (
        probe.getUTCFullYear() === y &&
        probe.getUTCMonth() === m - 1 &&
        probe.getUTCDate() === d
    );
};

export const normalizeExcelDate = (val) => {
    if (val === null || val === undefined || val === '') return '';

    if (val instanceof Date) {
        if (Number.isNaN(val.getTime())) return '';
        return `${val.getUTCFullYear()}-${pad2(val.getUTCMonth() + 1)}-${pad2(val.getUTCDate())}`;
    }

    if (typeof val === 'number' && Number.isFinite(val) && val > 20000) {
        const utc = new Date(Date.UTC(1899, 11, 30) + Math.floor(val) * 86400000);
        return `${utc.getUTCFullYear()}-${pad2(utc.getUTCMonth() + 1)}-${pad2(utc.getUTCDate())}`;
    }

    const str = toWesternDigits(val).trim();
    if (!str) return '';

    // ISO or YYYY-MM-DD / YYYY/MM/DD (including timestamps like 2026-12-15T00:00:00Z)
    let m = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[T\s].*)?$/);
    if (m) {
        const y = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10);
        const d = parseInt(m[3], 10);
        return isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : '';
    }

    // DD/MM/YYYY or DD-MM-YYYY
    m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (m) {
        const d = parseInt(m[1], 10);
        const mo = parseInt(m[2], 10);
        const y = parseInt(m[3], 10);
        return isValidYmd(y, mo, d) ? `${y}-${pad2(mo)}-${pad2(d)}` : '';
    }

    return '';
};

export const normalizeExcelTime = (val) => {
    if (val === null || val === undefined || val === '') return '';

    if (val instanceof Date) {
        if (Number.isNaN(val.getTime())) return '';
        return `${pad2(val.getUTCHours())}:${pad2(val.getUTCMinutes())}`;
    }

    if (typeof val === 'number' && Number.isFinite(val) && val >= 0 && val < 1) {
        const totalMinutes = Math.round(val * 1440) % 1440;
        const h = Math.floor(totalMinutes / 60);
        const min = totalMinutes % 60;
        return `${pad2(h)}:${pad2(min)}`;
    }

    const str = toWesternDigits(val).trim();
    if (!str) return '';

    // 12-hour format with AM/PM or ص/م
    let m = str.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?\s*(AM|PM|am|pm|ص|م)$/);
    if (m) {
        let h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        const meridiem = m[3].toLowerCase();
        if (h < 1 || h > 12 || min < 0 || min > 59) return '';
        const isPm = meridiem === 'pm' || meridiem === 'م';
        if (isPm && h !== 12) h += 12;
        if (!isPm && h === 12) h = 0;
        return `${pad2(h)}:${pad2(min)}`;
    }

    // 24-hour format HH:mm or HH:mm:ss
    m = str.match(/^(\d{1,2}):(\d{1,2})(?::\d{1,2})?$/);
    if (m) {
        const h = parseInt(m[1], 10);
        const min = parseInt(m[2], 10);
        if (h < 0 || h > 23 || min < 0 || min > 59) return '';
        return `${pad2(h)}:${pad2(min)}`;
    }

    return '';
};

export const findHolidayOnDate = (dateStr, holidays = []) => {
    const clean = normalizeExcelDate(dateStr);
    if (!clean || !Array.isArray(holidays)) return null;
    return (
        holidays.find((h) => {
            const start = normalizeExcelDate(h.start_date);
            const end = normalizeExcelDate(h.end_date || h.start_date);
            if (!start || !end) return false;
            return clean >= start && clean <= end;
        }) || null
    );
};

export const isWeekendDate = (dateStr) => {
    const clean = normalizeExcelDate(dateStr);
    if (!clean) return false;
    const day = dayjs(clean).day();
    return day === 5 || day === 6; // Friday or Saturday
};

const extractCellPrimitive = (cellValue) => {
    if (cellValue === null || cellValue === undefined) return '';
    if (cellValue instanceof Date || typeof cellValue === 'number' || typeof cellValue === 'string') {
        return cellValue;
    }
    if (typeof cellValue === 'object') {
        if (cellValue.result !== undefined) return extractCellPrimitive(cellValue.result);
        if (Array.isArray(cellValue.richText)) {
            return cellValue.richText.map((r) => r.text || '').join('');
        }
        if (cellValue.text !== undefined) return String(cellValue.text);
        if (cellValue.hyperlink !== undefined) return String(cellValue.text || cellValue.hyperlink);
    }
    return String(cellValue);
};

export const buildExamScheduleWorkbook = async ({
    examSchedule,
    grades = [],
    subjects = [],
    teachers = [],
    holidays = [],
    existingItems = null,
    schoolName = 'المدارس الذكية',
}) => {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = schoolName;
    workbook.created = new Date();

    const mainSheet = workbook.addWorksheet('جدول الاختبارات', {
        views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    });

    const refSheet = workbook.addWorksheet('البيانات المرجعية', {
        views: [{ rightToLeft: true }],
    });

    // Build Reference Sheet
    refSheet.columns = [
        { width: 22 }, // A: الصفوف الدراسية
        { width: 28 }, // B: شعب كل صف
        { width: 24 }, // C: المواد الدراسية
        { width: 28 }, // D: المعلمون (المراقبون)
        { width: 32 }, // E: الإجازات الرسمية
    ];

    const refHeaderRow = refSheet.addRow([
        'الصفوف الدراسية',
        'شعب كل صف',
        'المواد الدراسية',
        'المعلمون (المراقبون)',
        'الإجازات الرسمية',
    ]);
    refHeaderRow.height = 24;
    refHeaderRow.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    const divisionEntries = [];
    grades.forEach((g) => {
        (g.divisions || []).forEach((d) => {
            divisionEntries.push(`${g.name}: ${d.name}`);
        });
    });

    const holidayEntries = (holidays || []).map((h) => {
        const start = normalizeExcelDate(h.start_date);
        const end = normalizeExcelDate(h.end_date || h.start_date);
        return `${h.name} (${start}${end && end !== start ? ` إلى ${end}` : ''})`;
    });

    const maxRefLen = Math.max(
        grades.length,
        divisionEntries.length,
        subjects.length,
        teachers.length,
        holidayEntries.length
    );

    for (let i = 0; i < maxRefLen; i++) {
        refSheet.addRow([
            grades[i]?.name || '',
            divisionEntries[i] || '',
            subjects[i]?.name || '',
            teachers[i]?.name || '',
            holidayEntries[i] || '',
        ]);
    }

    // Build Main Sheet
    mainSheet.columns = [
        { width: 18 }, // A: التاريخ
        { width: 20 }, // B: الصف الدراسي
        { width: 18 }, // C: الشعبة
        { width: 22 }, // D: المادة الدراسية
        { width: 16 }, // E: وقت البدء
        { width: 16 }, // F: وقت الانتهاء
        { width: 18 }, // G: القاعة
        { width: 28 }, // H: المراقبون
        { width: 34 }, // I: المقرر المطلوب
    ];

    mainSheet.mergeCells('A1:I1');
    const titleCell = mainSheet.getCell('A1');
    titleCell.value = `${schoolName} - ${examSchedule?.title || 'جدول الاختبارات'}`;
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    mainSheet.getRow(1).height = 28;

    mainSheet.mergeCells('A2:I2');
    const hintCell = mainSheet.getCell('A2');
    hintCell.value =
        'أدخل البيانات بدءاً من الصف 5. اكتب "الكل" في عمود الشعبة لتشمل جميع شعب الصف، وافصل أسماء المراقبين بفاصلة (،). راجع ورقة "البيانات المرجعية" للأسماء المعتمدة.';
    hintCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
    hintCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    hintCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    mainSheet.getRow(2).height = 24;

    mainSheet.getRow(3).height = 8;

    const headers = [
        'التاريخ (YYYY-MM-DD)',
        'الصف الدراسي',
        'الشعبة (أو الكل)',
        'المادة الدراسية',
        'وقت البدء (HH:MM)',
        'وقت الانتهاء (HH:MM)',
        'القاعة',
        'المراقبون (مفصول بفاصلة)',
        'المقرر المطلوب',
    ];
    const headerRow = mainSheet.getRow(4);
    headerRow.values = headers;
    headerRow.height = 28;
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

    const dataRows = [];

    if (Array.isArray(existingItems) && existingItems.length > 0) {
        const groups = {};
        existingItems.forEach((item) => {
            const dateStr = normalizeExcelDate(item.exam_date);
            const gradeId = item.grade_id || item.division?.grade_id || '';
            const start = normalizeExcelTime(item.start_time);
            const end = normalizeExcelTime(item.end_time);
            const room = (item.room || '').trim();
            const proctorIds = Array.isArray(item.proctor_ids)
                ? [...item.proctor_ids].sort()
                : Array.isArray(item.proctors)
                  ? item.proctors.map((p) => p.id).sort()
                  : [];
            const syllabus = (item.syllabus || '').trim();
            const key = `${dateStr}_${gradeId}_${item.subject_id}_${start}_${end}_${room}_${proctorIds.join(',')}_${syllabus}`;

            if (!groups[key]) {
                const gradeObj = grades.find((g) => String(g.id) === String(gradeId));
                const subjObj = subjects.find((s) => String(s.id) === String(item.subject_id));
                const proctorNames = proctorIds
                    .map((pid) => teachers.find((t) => String(t.id) === String(pid))?.name || item.proctors?.find((p) => p.id === pid)?.name)
                    .filter(Boolean);

                groups[key] = {
                    dateStr,
                    gradeObj,
                    gradeName: gradeObj?.name || item.division?.grade?.name || '',
                    divisionIds: [],
                    divisionNames: [],
                    subjectName: item.subject_name || item.subject?.name || subjObj?.name || '',
                    start,
                    end,
                    room,
                    proctorNames,
                    syllabus,
                };
            }
            const divId = item.division_id;
            if (divId && !groups[key].divisionIds.includes(divId)) {
                groups[key].divisionIds.push(divId);
                const divObj = groups[key].gradeObj?.divisions?.find((d) => String(d.id) === String(divId));
                const divName = divObj?.name || item.division_name || item.division?.name || '';
                if (divName) groups[key].divisionNames.push(divName);
            }
        });

        Object.values(groups)
            .sort((a, b) => a.dateStr.localeCompare(b.dateStr) || a.start.localeCompare(b.start))
            .forEach((g) => {
                const totalGradeDivs = g.gradeObj?.divisions?.length || 0;
                const divisionText =
                    totalGradeDivs > 0 && g.divisionIds.length >= totalGradeDivs
                        ? 'الكل'
                        : g.divisionNames.join('، ');
                dataRows.push([
                    g.dateStr,
                    g.gradeName,
                    divisionText,
                    g.subjectName,
                    g.start,
                    g.end,
                    g.room,
                    g.proctorNames.join('، '),
                    g.syllabus,
                ]);
            });
    } else {
        const baseDate = normalizeExcelDate(examSchedule?.period?.fill_start_date) || dayjs().add(1, 'day').format('YYYY-MM-DD');
        const nextDate = dayjs(baseDate).add(1, 'day').format('YYYY-MM-DD');
        const sampleGrade = grades[0]?.name || 'الصف الأول';
        const sampleSubj1 = grades[0]?.subjects?.[0]?.name || subjects[0]?.name || 'الرياضيات';
        const sampleSubj2 = grades[0]?.subjects?.[1]?.name || subjects[1]?.name || subjects[0]?.name || 'اللغة العربية';
        const sampleTeacher = teachers[0]?.name || '';

        dataRows.push([
            baseDate,
            sampleGrade,
            'الكل',
            sampleSubj1,
            '08:00',
            '09:30',
            'قاعة 101',
            sampleTeacher,
            'الوحدات 1 - 3',
        ]);
        dataRows.push([
            nextDate,
            sampleGrade,
            'الكل',
            sampleSubj2,
            '08:00',
            '09:30',
            'قاعة 102',
            sampleTeacher,
            'الوحدة الأولى والثانية',
        ]);
    }

    dataRows.forEach((rowVals, idx) => {
        const row = mainSheet.getRow(5 + idx);
        row.values = rowVals;
        row.height = 24;
        row.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.font = { name: 'Segoe UI', size: 10 };
            cell.border = {
                bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            };
        });
    });

    // Apply Excel Data Validation Dropdowns on rows 5..120
    const gradeRefFormula = grades.length > 0 ? `'البيانات المرجعية'!$A$2:$A$${grades.length + 1}` : null;
    const subjectRefFormula = subjects.length > 0 ? `'البيانات المرجعية'!$C$2:$C$${subjects.length + 1}` : null;
    const teacherRefFormula = teachers.length > 0 ? `'البيانات المرجعية'!$D$2:$D$${teachers.length + 1}` : null;

    for (let r = 5; r <= 120; r++) {
        if (gradeRefFormula) {
            mainSheet.getCell(`B${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [gradeRefFormula],
            };
        }
        if (subjectRefFormula) {
            mainSheet.getCell(`D${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                formulae: [subjectRefFormula],
            };
        }
        if (teacherRefFormula) {
            mainSheet.getCell(`H${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                errorStyle: 'information',
                showErrorMessage: false,
                formulae: [teacherRefFormula],
            };
        }
    }

    return workbook;
};

export const downloadExamScheduleTemplate = async (params) => {
    const workbook = await buildExamScheduleWorkbook(params);
    const buffer = await workbook.xlsx.writeBuffer();
    const isExport = Array.isArray(params.existingItems) && params.existingItems.length > 0;
    const safeTitle = (params.examSchedule?.title || 'جدول_الاختبارات').replace(/[/\\?%*:|"<>]/g, '_');
    const prefix = isExport ? 'تصدير_جدول' : 'قالب_استيراد';
    const filename = `${prefix}_${safeTitle}_${dayjs().format('YYYY-MM-DD')}.xlsx`;

    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    window.URL.revokeObjectURL(url);
};

const HEADER_ALIASES = {
    exam_date: ['التاريخ', 'تاريخ الاختبار', 'date', 'exam_date', 'exam date', 'يوم الاختبار'],
    grade: ['الصف الدراسي', 'الصف', 'grade', 'class'],
    division: ['الشعبه', 'الشعب', 'الفصل', 'division', 'section', 'divisions'],
    subject: ['الماده الدراسيه', 'الماده', 'subject', 'course'],
    start_time: ['وقت البدء', 'من الساعه', 'بدايه الاختبار', 'start_time', 'start time', 'start', 'من'],
    end_time: ['وقت الانتهاء', 'الي الساعه', 'نهايه الاختبار', 'end_time', 'end time', 'end', 'الي'],
    room: ['القاعه', 'اللجنه', 'المكان', 'room', 'hall'],
    proctors: ['المراقبون', 'المراقب', 'المعلمون', 'الملاحظون', 'proctors', 'proctor', 'teachers'],
    syllabus: ['المقرر المطلوب', 'المقرر', 'المنهج', 'المحتوي', 'syllabus', 'topics'],
};

const detectHeaderMap = (rowValues) => {
    const map = {};
    rowValues.forEach((cellVal, idx) => {
        const norm = normalizeArabicText(extractCellPrimitive(cellVal));
        if (!norm) return;
        Object.entries(HEADER_ALIASES).forEach(([field, aliases]) => {
            if (map[field] !== undefined) return;
            const matched = aliases.some((alias) => {
                const normAlias = normalizeArabicText(alias);
                return norm === normAlias || norm.startsWith(normAlias) || norm.includes(normAlias);
            });
            if (matched) {
                map[field] = idx;
            }
        });
    });

    const coreHits = ['exam_date', 'grade', 'subject'].filter((f) => map[f] !== undefined).length;
    return coreHits >= 2 ? map : null;
};

const matchEntity = (rawName, list) => {
    const norm = normalizeArabicText(rawName);
    if (!norm || !Array.isArray(list)) return null;
    const exact = list.find((item) => normalizeArabicText(item.name) === norm);
    if (exact) return exact;
    return list.find((item) => {
        const candidate = normalizeArabicText(item.name);
        return candidate.includes(norm) || norm.includes(candidate);
    }) || null;
};

const resolveDivisionsForRow = (rawDivision, gradeObj) => {
    const divisions = gradeObj?.divisions || [];
    if (!gradeObj || divisions.length === 0) {
        return { divisionIds: [], allSelected: false, unmatched: [] };
    }

    const rawTrimmed = toWesternDigits(rawDivision).trim();
    const norm = normalizeArabicText(rawTrimmed);
    if (!norm || ['الكل', 'جميع', 'الجميع', 'كافه', 'all', '*'].includes(norm)) {
        return {
            divisionIds: divisions.map((d) => d.id),
            allSelected: true,
            unmatched: [],
        };
    }

    const tokens = rawTrimmed
        .split(/[،,/+&\n]+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const matchedIds = [];
    const unmatched = [];
    tokens.forEach((tok) => {
        const tokNorm = normalizeArabicText(tok);
        const found = divisions.find((d) => {
            const dNorm = normalizeArabicText(d.name);
            return dNorm === tokNorm || dNorm.replace(/^شعبه\s*/, '') === tokNorm.replace(/^شعبه\s*/, '');
        });
        if (found) {
            if (!matchedIds.includes(found.id)) matchedIds.push(found.id);
        } else {
            unmatched.push(tok);
        }
    });

    return {
        divisionIds: matchedIds,
        allSelected: matchedIds.length === divisions.length && divisions.length > 0,
        unmatched,
    };
};

const resolveProctorsForRow = (rawProctors, teachers) => {
    const rawTrimmed = String(rawProctors ?? '').trim();
    if (!rawTrimmed) return { proctorIds: [], unmatched: [] };

    const tokens = rawTrimmed
        .split(/[،,;\n]+/)
        .map((t) => t.trim())
        .filter(Boolean);

    const proctorIds = [];
    const unmatched = [];

    tokens.forEach((tok) => {
        const found = matchEntity(tok, teachers);
        if (found) {
            if (!proctorIds.includes(found.id)) proctorIds.push(found.id);
        } else {
            unmatched.push(tok);
        }
    });

    return { proctorIds, unmatched };
};

const buildImportRowsFromMatrix = (matrixRows, { grades = [], subjects = [], teachers = [] }) => {
    let headerMap = null;
    let headerRowIndex = -1;

    const scanLimit = Math.min(10, matrixRows.length);
    for (let i = 0; i < scanLimit; i++) {
        const candidate = detectHeaderMap(matrixRows[i] || []);
        if (candidate) {
            headerMap = candidate;
            headerRowIndex = i;
            break;
        }
    }

    // Fallback positional order A..I if user stripped headers
    if (!headerMap) {
        headerMap = {
            exam_date: 0,
            grade: 1,
            division: 2,
            subject: 3,
            start_time: 4,
            end_time: 5,
            room: 6,
            proctors: 7,
            syllabus: 8,
        };
        headerRowIndex = 0;
    }

    const parsedRows = [];

    for (let r = headerRowIndex + 1; r < matrixRows.length; r++) {
        const rowArr = matrixRows[r] || [];
        const nonEmpty = rowArr.some((v) => String(extractCellPrimitive(v)).trim() !== '');
        if (!nonEmpty) continue;

        const rawDate = extractCellPrimitive(rowArr[headerMap.exam_date]);
        const rawGrade = String(extractCellPrimitive(rowArr[headerMap.grade]) ?? '').trim();
        const rawDivision = headerMap.division !== undefined ? String(extractCellPrimitive(rowArr[headerMap.division]) ?? '').trim() : '';
        const rawSubject = String(extractCellPrimitive(rowArr[headerMap.subject]) ?? '').trim();
        const rawStart = headerMap.start_time !== undefined ? extractCellPrimitive(rowArr[headerMap.start_time]) : '';
        const rawEnd = headerMap.end_time !== undefined ? extractCellPrimitive(rowArr[headerMap.end_time]) : '';
        const rawRoom = headerMap.room !== undefined ? String(extractCellPrimitive(rowArr[headerMap.room]) ?? '').trim() : '';
        const rawProctors = headerMap.proctors !== undefined ? String(extractCellPrimitive(rowArr[headerMap.proctors]) ?? '').trim() : '';
        const rawSyllabus = headerMap.syllabus !== undefined ? String(extractCellPrimitive(rowArr[headerMap.syllabus]) ?? '').trim() : '';

        const matchedGrade = matchEntity(rawGrade, grades);
        const divisionResolution = resolveDivisionsForRow(rawDivision, matchedGrade);

        const subjectPool = matchedGrade?.subjects?.length ? matchedGrade.subjects : subjects;
        const matchedSubject = matchEntity(rawSubject, subjectPool) || matchEntity(rawSubject, subjects);

        const proctorResolution = resolveProctorsForRow(rawProctors, teachers);

        parsedRows.push({
            rowKey: `row_${r}_${Math.random().toString(36).slice(2, 7)}`,
            sourceRowNumber: r + 1,
            exam_date: normalizeExcelDate(rawDate),
            raw_date: rawDate instanceof Date ? normalizeExcelDate(rawDate) : String(rawDate ?? ''),
            grade_id: matchedGrade?.id || '',
            raw_grade: rawGrade,
            division_ids: divisionResolution.divisionIds,
            all_divisions: divisionResolution.allSelected,
            raw_division: rawDivision,
            unmatched_divisions: divisionResolution.unmatched,
            subject_id: matchedSubject?.id || '',
            raw_subject: rawSubject,
            start_time: normalizeExcelTime(rawStart),
            raw_start_time: String(rawStart ?? ''),
            end_time: normalizeExcelTime(rawEnd),
            raw_end_time: String(rawEnd ?? ''),
            room: rawRoom,
            proctor_ids: proctorResolution.proctorIds,
            raw_proctors: rawProctors,
            unmatched_proctors: proctorResolution.unmatched,
            syllabus: rawSyllabus,
        });
    }

    return {
        rows: parsedRows,
        detectedColumns: Object.keys(headerMap),
    };
};

const parseCsvLine = (line, delimiter = ',') => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (ch === delimiter && !inQuotes) {
            result.push(current);
            current = '';
        } else {
            current += ch;
        }
    }
    result.push(current);
    return result;
};

export const parseExamScheduleCsvText = (csvText, context) => {
    const cleanText = String(csvText || '').replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim() !== '');
    const firstLine = lines[0] || '';
    const delimiter =
        (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const matrix = lines.map((line) => parseCsvLine(line, delimiter));
    const parsed = buildImportRowsFromMatrix(matrix, context);
    return { ...parsed, sheetName: 'CSV' };
};

export const parseExamScheduleWorkbookBuffer = async (arrayBuffer, context) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const sheet =
        workbook.worksheets.find((ws) => ws.name.includes('اختبار')) || workbook.worksheets[0];

    if (!sheet) {
        return { rows: [], detectedColumns: [], sheetName: '' };
    }

    const matrix = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
        const rowArr = [];
        for (let c = 1; c <= Math.max(9, row.cellCount); c++) {
            rowArr.push(row.getCell(c).value);
        }
        matrix.push(rowArr);
    });

    const parsed = buildImportRowsFromMatrix(matrix, context);
    return { ...parsed, sheetName: sheet.name };
};

export const parseExamScheduleFile = async (file, context) => {
    const name = (file?.name || '').toLowerCase();
    if (name.endsWith('.csv')) {
        const text = await file.text();
        return parseExamScheduleCsvText(text, context);
    }
    const buffer = await file.arrayBuffer();
    return parseExamScheduleWorkbookBuffer(buffer, context);
};

export const buildClonedScheduleRows = (
    sourceSchedule,
    targetStartDate,
    { holidays = [], skipWeekends = true, skipHolidays = true } = {}
) => {
    const items = sourceSchedule?.items || [];
    const cleanTargetStart = normalizeExcelDate(targetStartDate);
    if (items.length === 0 || !cleanTargetStart) return [];

    const sourceDates = [...new Set(items.map((i) => normalizeExcelDate(i.exam_date)).filter(Boolean))].sort();
    if (sourceDates.length === 0) return [];

    const isBlockedDate = (dateStr) =>
        (skipWeekends && isWeekendDate(dateStr)) ||
        (skipHolidays && Boolean(findHolidayOnDate(dateStr, holidays)));

    const advancePastBlocked = (startStr) => {
        let cursor = dayjs(startStr);
        let guard = 0;
        while (isBlockedDate(cursor.format('YYYY-MM-DD')) && guard < 180) {
            cursor = cursor.add(1, 'day');
            guard++;
        }
        return cursor.format('YYYY-MM-DD');
    };

    const dateMapping = {};
    sourceDates.forEach((srcDate, idx) => {
        if (idx === 0) {
            dateMapping[srcDate] = advancePastBlocked(cleanTargetStart);
        } else {
            const prevSrc = dayjs(sourceDates[idx - 1]);
            const currSrc = dayjs(srcDate);
            const gap = Math.max(1, currSrc.diff(prevSrc, 'day'));
            const candidate = dayjs(dateMapping[sourceDates[idx - 1]]).add(gap, 'day').format('YYYY-MM-DD');
            dateMapping[srcDate] = advancePastBlocked(candidate);
        }
    });

    const groups = {};
    items.forEach((item) => {
        const origDate = normalizeExcelDate(item.exam_date);
        const mappedDate = dateMapping[origDate];
        if (!mappedDate) return;

        const gradeId = item.division?.grade_id || item.grade_id || '';
        const start = normalizeExcelTime(item.start_time);
        const end = normalizeExcelTime(item.end_time);
        const room = (item.room || '').trim();
        const proctorIds = Array.isArray(item.proctors)
            ? item.proctors.map((p) => p.id).sort()
            : Array.isArray(item.proctor_ids)
              ? [...item.proctor_ids].sort()
              : [];
        const syllabus = (item.syllabus || '').trim();
        const key = `${mappedDate}_${gradeId}_${item.subject_id}_${start}_${end}_${room}_${proctorIds.join(',')}_${syllabus}`;

        if (!groups[key]) {
            groups[key] = {
                rowKey: `clone_${key}_${Math.random().toString(36).slice(2, 6)}`,
                sourceRowNumber: Object.keys(groups).length + 1,
                exam_date: mappedDate,
                raw_date: mappedDate,
                grade_id: gradeId,
                raw_grade: item.division?.grade?.name || '',
                division_ids: [],
                all_divisions: false,
                raw_division: '',
                unmatched_divisions: [],
                subject_id: item.subject_id || '',
                raw_subject: item.subject?.name || '',
                start_time: start,
                raw_start_time: start,
                end_time: end,
                raw_end_time: end,
                room,
                proctor_ids: proctorIds,
                raw_proctors: '',
                unmatched_proctors: [],
                syllabus,
            };
        }
        if (item.division_id && !groups[key].division_ids.includes(item.division_id)) {
            groups[key].division_ids.push(item.division_id);
        }
    });

    return Object.values(groups).sort(
        (a, b) => a.exam_date.localeCompare(b.exam_date) || (a.start_time || '').localeCompare(b.start_time || '')
    );
};

export const validateImportRows = (
    rows = [],
    { grades = [], subjects = [], teachers = [], holidays = [], existingItems = [], mode = 'merge' } = {}
) => {
    const teacherMap = new Map(teachers.map((t) => [String(t.id), t.name]));

    // Build keys for incoming items that overwrite existing ones in merge mode
    const replacedCompositeKeys = new Set();
    if (mode === 'merge') {
        rows.forEach((r) => {
            if (r.exam_date && r.subject_id && Array.isArray(r.division_ids)) {
                r.division_ids.forEach((divId) => {
                    replacedCompositeKeys.add(`${divId}_${r.subject_id}_${r.exam_date}`);
                });
            }
        });
    }

    const activeExisting =
        mode === 'merge'
            ? existingItems.filter((ex) => {
                  const key = `${ex.division_id}_${ex.subject_id}_${normalizeExcelDate(ex.exam_date)}`;
                  return !replacedCompositeKeys.has(key);
              })
            : [];

    const validatedRows = rows.map((row, idx) => {
        const errors = [];
        const warnings = [];

        const gradeObj = grades.find((g) => String(g.id) === String(row.grade_id));
        const subjectObj = subjects.find((s) => String(s.id) === String(row.subject_id));
        const validDivisionIds = (row.division_ids || []).filter((did) =>
            gradeObj?.divisions?.some((d) => String(d.id) === String(did))
        );

        if (!row.exam_date) {
            errors.push(`تاريخ الاختبار غير صالح أو مفقود${row.raw_date ? ` (${row.raw_date})` : ''}.`);
        } else {
            const holiday = findHolidayOnDate(row.exam_date, holidays);
            if (holiday) {
                warnings.push(`يوافق إجازة رسمية: ${holiday.name}.`);
            }
            if (isWeekendDate(row.exam_date)) {
                warnings.push('يوافق عطلة نهاية الأسبوع (الجمعة/السبت).');
            }
        }

        if (!gradeObj) {
            errors.push(`الصف الدراسي غير موجود${row.raw_grade ? ` (${row.raw_grade})` : ''}.`);
        } else if (validDivisionIds.length === 0) {
            errors.push('يرجى تحديد شعبة واحدة على الأقل.');
        } else if (row.unmatched_divisions?.length > 0) {
            warnings.push(`شعب لم يتم التعرف عليها: ${row.unmatched_divisions.join('، ')}`);
        }

        if (!subjectObj) {
            errors.push(`المادة الدراسية غير موجودة${row.raw_subject ? ` (${row.raw_subject})` : ''}.`);
        }

        if (row.raw_start_time && !row.start_time) {
            errors.push(`صيغة وقت البدء غير صحيحة (${row.raw_start_time}).`);
        }
        if (row.raw_end_time && !row.end_time) {
            errors.push(`صيغة وقت الانتهاء غير صحيحة (${row.raw_end_time}).`);
        }
        if (row.start_time && row.end_time && row.end_time <= row.start_time) {
            errors.push('يجب أن يكون وقت الانتهاء بعد وقت البدء.');
        } else if (!row.start_time || !row.end_time) {
            warnings.push('وقت البدء أو الانتهاء غير محدد (لن يتمكن النظام من فحص التداخل الزمني بالكامل).');
        }

        if (row.unmatched_proctors?.length > 0) {
            warnings.push(`أسماء مراقبين غير مطابقة: ${row.unmatched_proctors.join('، ')}`);
        }

        // Overlap checks against other imported rows and kept existing items
        if (row.exam_date && row.start_time && row.end_time && row.end_time > row.start_time) {
            const conflictedProctors = new Set();
            const conflictedRooms = new Set();
            const conflictedDivisions = new Set();

            const checkAgainst = (other) => {
                if (other.date !== row.exam_date || !other.start || !other.end) return;
                if (!(row.start_time < other.end && other.start < row.end_time)) return;

                // Proctor conflict across DIFFERENT specified rooms
                if (row.room && other.room && row.room !== other.room) {
                    const otherProctorIds = (other.proctorIds || []).map(Number);
                    (row.proctor_ids || []).forEach((pid) => {
                        if (otherProctorIds.includes(Number(pid))) {
                            conflictedProctors.add(teacherMap.get(String(pid)) || `معلم #${pid}`);
                        }
                    });
                }

                // Room overlap warning (could be merged halls)
                if (row.room && other.room && row.room === other.room && String(other.gradeId) !== String(row.grade_id)) {
                    conflictedRooms.add(row.room);
                }

                // Same division double-booked at overlapping time
                const otherDivisionIds = (other.divisionIds || []).map(Number);
                validDivisionIds.forEach((did) => {
                    if (otherDivisionIds.includes(Number(did)) && String(other.subjectId) !== String(row.subject_id)) {
                        const divName = gradeObj?.divisions?.find((d) => String(d.id) === String(did))?.name || did;
                        conflictedDivisions.add(`${gradeObj?.name || ''} - ${divName}`);
                    }
                });
            };

            rows.forEach((otherRow, otherIdx) => {
                if (otherIdx === idx) return;
                checkAgainst({
                    date: otherRow.exam_date,
                    start: otherRow.start_time,
                    end: otherRow.end_time,
                    room: (otherRow.room || '').trim(),
                    proctorIds: otherRow.proctor_ids || [],
                    divisionIds: otherRow.division_ids || [],
                    gradeId: otherRow.grade_id,
                    subjectId: otherRow.subject_id,
                });
            });

            activeExisting.forEach((ex) => {
                checkAgainst({
                    date: normalizeExcelDate(ex.exam_date),
                    start: normalizeExcelTime(ex.start_time),
                    end: normalizeExcelTime(ex.end_time),
                    room: (ex.room || '').trim(),
                    proctorIds: ex.proctor_ids || (ex.proctors || []).map((p) => p.id),
                    divisionIds: [ex.division_id],
                    gradeId: ex.grade_id || ex.division?.grade_id,
                    subjectId: ex.subject_id,
                });
            });

            if (conflictedProctors.size > 0) {
                errors.push(`تعارض مراقب في قاعتين مختلفتين بنفس الوقت: ${[...conflictedProctors].join('، ')}.`);
            }
            if (conflictedDivisions.size > 0) {
                warnings.push(`تداخل زمني لنفس الشعبة مع اختبار آخر: ${[...conflictedDivisions].join('، ')}.`);
            }
            if (conflictedRooms.size > 0) {
                warnings.push(`القاعة (${[...conflictedRooms].join('، ')}) مشتركة مع صف آخر في نفس التوقيت.`);
            }
        }

        const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
        return {
            ...row,
            division_ids: validDivisionIds,
            errors,
            warnings,
            status,
        };
    });

    const stats = {
        total: validatedRows.length,
        valid: validatedRows.filter((r) => r.status === 'valid').length,
        warning: validatedRows.filter((r) => r.status === 'warning').length,
        error: validatedRows.filter((r) => r.status === 'error').length,
    };

    return { rows: validatedRows, stats };
};

export const expandImportRowsToScheduleItems = (validatedRows = [], { grades = [], subjects = [], teachers = [] } = {}) => {
    const result = [];

    validatedRows
        .filter((r) => r.status !== 'error')
        .forEach((row) => {
            const gradeObj = grades.find((g) => String(g.id) === String(row.grade_id));
            const subjectObj = subjects.find((s) => String(s.id) === String(row.subject_id));
            const proctorIds = (row.proctor_ids || []).map((id) => Number(id));
            const proctorObjs = teachers.filter((t) => proctorIds.includes(Number(t.id)));

            (row.division_ids || []).forEach((divId) => {
                const divObj = gradeObj?.divisions?.find((d) => String(d.id) === String(divId));
                result.push({
                    id: `imp_${Math.random().toString(36).slice(2, 10)}`,
                    division_id: Number(divId),
                    subject_id: Number(row.subject_id),
                    exam_date: row.exam_date,
                    start_time: row.start_time || '',
                    end_time: row.end_time || '',
                    room: row.room || '',
                    syllabus: row.syllabus || '',
                    proctor_ids: proctorIds,
                    proctors: proctorObjs,
                    subject_name: subjectObj?.name || row.raw_subject || '',
                    division_name: divObj?.name || '',
                    grade_id: Number(row.grade_id),
                });
            });
        });

    return result;
};
