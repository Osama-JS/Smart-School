import ExcelJS from 'exceljs';
import dayjs from 'dayjs';
import { normalizeArabicText, toWesternDigits } from './examScheduleExcel.js';

export const DAYS_TRANSLATION = {
    Sunday: 'الأحد',
    Monday: 'الإثنين',
    Tuesday: 'الثلاثاء',
    Wednesday: 'الأربعاء',
    Thursday: 'الخميس',
    Friday: 'الجمعة',
    Saturday: 'السبت',
};

const DAY_ALIASES = {
    Sunday: ['sunday', 'sun', 'الاحد', 'احد', 'يوم الاحد'],
    Monday: ['monday', 'mon', 'الاثنين', 'اثنين', 'يوم الاثنين'],
    Tuesday: ['tuesday', 'tue', 'tues', 'الثلاثاء', 'ثلاثاء', 'يوم الثلاثاء'],
    Wednesday: ['wednesday', 'wed', 'الاربعاء', 'اربعاء', 'يوم الاربعاء'],
    Thursday: ['thursday', 'thu', 'thur', 'thurs', 'الخميس', 'خميس', 'يوم الخميس'],
    Friday: ['friday', 'fri', 'الجمعه', 'جمعه', 'يوم الجمعه'],
    Saturday: ['saturday', 'sat', 'السبت', 'سبت', 'يوم السبت'],
};

const ORDINAL_ARABIC_WORDS = {
    الاول: 1,
    الاولي: 1,
    الثاني: 2,
    الثانيه: 2,
    الثالث: 3,
    الثالثه: 3,
    الرابع: 4,
    الرابعه: 4,
    الخامس: 5,
    الخامسه: 5,
    السادس: 6,
    السادسه: 6,
    السابع: 7,
    السابعه: 7,
    الثامن: 8,
    الثامنه: 8,
    التاسع: 9,
    التاسعه: 9,
    العاشر: 10,
    العاشره: 10,
};

const HEADER_ALIASES = {
    grade: ['الصف الدراسي', 'الصف', 'grade', 'class'],
    division: ['الشعبه', 'الشعب', 'الفصل', 'division', 'section'],
    day: ['اليوم', 'يوم الدوام', 'day', 'day_of_week', 'weekday'],
    period: ['الحصه', 'الفتره', 'period', 'slot'],
    subject: ['الماده الدراسيه', 'الماده', 'subject', 'course'],
    teacher: ['المعلم', 'الاستاذ', 'المدرس', 'teacher', 'instructor'],
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

export const flattenGradesFromSections = (sections = []) => {
    const grades = [];
    (sections || []).forEach((section) => {
        (section.grades || []).forEach((grade) => {
            grades.push({
                ...grade,
                section_id: grade.section_id ?? section.id,
                section_name: grade.section_name ?? section.name,
                divisions: grade.divisions || [],
                subject_ids: (grade.subject_ids || []).map(Number),
                timetable_group_ids: (grade.timetable_group_ids || []).map(Number),
            });
        });
    });
    return grades;
};

export const normalizeDayOfWeek = (rawVal) => {
    const norm = normalizeArabicText(extractCellPrimitive(rawVal)).replace(/^يوم\s+/, '').trim();
    if (!norm) return '';

    for (const [canonical, aliases] of Object.entries(DAY_ALIASES)) {
        if (aliases.some((alias) => normalizeArabicText(alias) === norm)) {
            return canonical;
        }
    }
    return '';
};

export const getAllowedPeriodsForGrade = (gradeObj, allPeriods = [], includeBreaks = false) => {
    const groupIds = (gradeObj?.timetable_group_ids || []).map(Number);

    return (allPeriods || [])
        .filter((period) => {
            if (!includeBreaks && period.is_break) return false;
            if (!gradeObj) return true;
            if (period.timetable_group_id === null || period.timetable_group_id === undefined || period.timetable_group_id === '') {
                return true;
            }
            return groupIds.includes(Number(period.timetable_group_id));
        })
        .sort((a, b) => String(a.start_time || '').localeCompare(String(b.start_time || '')));
};

export const resolvePeriodForGrade = (rawPeriod, gradeObj, allPeriods = []) => {
    const rawStr = toWesternDigits(extractCellPrimitive(rawPeriod)).trim();
    const norm = normalizeArabicText(rawStr);
    if (!norm) {
        return { period: null, isBreak: false, outOfGroup: false };
    }

    const gradePeriodsWithBreaks = getAllowedPeriodsForGrade(gradeObj, allPeriods, true);
    const allowedPeriods = getAllowedPeriodsForGrade(gradeObj, allPeriods, false);

    // 1. Exact name match within the grade's allowed periods (detect breaks explicitly)
    const exactInGrade = gradePeriodsWithBreaks.find((p) => normalizeArabicText(p.period_name) === norm);
    if (exactInGrade) {
        return {
            period: exactInGrade,
            isBreak: Boolean(exactInGrade.is_break),
            outOfGroup: false,
        };
    }

    // 2. Ordinal / numeric match (e.g. "1", "الحصة 2", "P3", "الأولى")
    let ordinal = null;
    const numMatch = rawStr.match(/^(?:الحصة|الحصه|فترة|فتره|period|p)?\s*(\d{1,2})\s*$/i);
    if (numMatch) {
        ordinal = parseInt(numMatch[1], 10);
    } else {
        const cleanedOrdinal = norm.replace(/^(?:الحصه|الفتره|حصه|فتره)\s+/, '').trim();
        if (ORDINAL_ARABIC_WORDS[cleanedOrdinal]) {
            ordinal = ORDINAL_ARABIC_WORDS[cleanedOrdinal];
        } else {
            for (const [word, num] of Object.entries(ORDINAL_ARABIC_WORDS)) {
                if (norm === word || norm.endsWith(` ${word}`)) {
                    ordinal = num;
                    break;
                }
            }
        }
    }

    if (ordinal !== null && ordinal >= 1 && ordinal <= allowedPeriods.length) {
        return {
            period: allowedPeriods[ordinal - 1],
            isBreak: false,
            outOfGroup: false,
        };
    }

    // 3. Start time match (e.g. "07:30" or "07:30 - 08:15")
    const timeMatch = rawStr.match(/\b(\d{1,2}):(\d{2})\b/);
    if (timeMatch) {
        const hhmm = `${String(parseInt(timeMatch[1], 10)).padStart(2, '0')}:${timeMatch[2]}`;
        const byTimeInGrade = gradePeriodsWithBreaks.find((p) => String(p.start_time || '').slice(0, 5) === hhmm);
        if (byTimeInGrade) {
            return {
                period: byTimeInGrade,
                isBreak: Boolean(byTimeInGrade.is_break),
                outOfGroup: false,
            };
        }
    }

    // 4. Unique partial match inside grade's non-break periods
    if (norm.length >= 2) {
        const partialMatches = allowedPeriods.filter((p) => {
            const pNorm = normalizeArabicText(p.period_name);
            return pNorm.includes(norm) || norm.includes(pNorm);
        });
        if (partialMatches.length === 1) {
            return {
                period: partialMatches[0],
                isBreak: false,
                outOfGroup: false,
            };
        }
    }

    // 5. Fallback check against all branch periods to report break or out-of-group accurately
    const exactInBranch = (allPeriods || []).find((p) => normalizeArabicText(p.period_name) === norm);
    if (exactInBranch) {
        if (exactInBranch.is_break) {
            return { period: exactInBranch, isBreak: true, outOfGroup: false };
        }
        if (gradeObj) {
            return { period: exactInBranch, isBreak: false, outOfGroup: true };
        }
        return { period: exactInBranch, isBreak: false, outOfGroup: false };
    }

    return { period: null, isBreak: false, outOfGroup: false };
};

const stripDivisionPrefix = (normText) =>
    normText.replace(/^(?:شعبه|فصل|قسم)\s*/u, '').trim();

const matchDivisionInGrade = (rawDivision, gradeObj) => {
    const normDiv = normalizeArabicText(rawDivision);
    if (!normDiv || !gradeObj) return null;

    const divisions = gradeObj.divisions || [];
    const strippedInput = stripDivisionPrefix(normDiv);

    const exact = divisions.find((d) => {
        const dNorm = normalizeArabicText(d.name);
        return dNorm === normDiv || stripDivisionPrefix(dNorm) === strippedInput;
    });
    if (exact) return exact;

    if (strippedInput.length >= 2) {
        const prefixMatches = divisions.filter((d) => {
            const dNorm = normalizeArabicText(d.name);
            const dShort = stripDivisionPrefix(dNorm);
            return dNorm.startsWith(normDiv) || dShort.startsWith(strippedInput);
        });
        if (prefixMatches.length === 1) return prefixMatches[0];
    }

    return null;
};

const matchGradeByText = (rawGrade, grades = []) => {
    const norm = normalizeArabicText(rawGrade);
    if (!norm) return null;

    const exact = grades.find((g) => normalizeArabicText(g.name) === norm);
    if (exact) return exact;

    const partial = grades.filter((g) => {
        const gNorm = normalizeArabicText(g.name);
        return gNorm.includes(norm) || norm.includes(gNorm);
    });
    return partial.length === 1 ? partial[0] : null;
};

const tryResolveCombinedGradeDivision = (combinedRaw, grades = []) => {
    const text = toWesternDigits(combinedRaw).trim();
    if (!text) return { gradeObj: null, divisionObj: null };

    const normFull = normalizeArabicText(text);

    // Try exact combined match against "{grade} - {division}" or "{grade} {division}"
    for (const grade of grades) {
        const gNorm = normalizeArabicText(grade.name);
        for (const div of grade.divisions || []) {
            const dNorm = normalizeArabicText(div.name);
            const dShort = stripDivisionPrefix(dNorm);
            if (
                normFull === `${gNorm} ${dNorm}` ||
                normFull === `${gNorm} - ${dNorm}` ||
                normFull === `${gNorm}-${dNorm}` ||
                normFull === `${gNorm} ${dShort}` ||
                normFull === `${gNorm} - ${dShort}` ||
                normFull === `${gNorm}-${dShort}`
            ) {
                return { gradeObj: grade, divisionObj: div };
            }
        }
    }

    // Try splitting by common separators
    const parts = text.split(/[-/|:\\()]+/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
        for (let i = 1; i < parts.length; i++) {
            const left = parts.slice(0, i).join(' - ');
            const right = parts.slice(i).join(' - ');
            const gradeObj = matchGradeByText(left, grades);
            if (gradeObj) {
                const divisionObj = matchDivisionInGrade(right, gradeObj);
                if (divisionObj) {
                    return { gradeObj, divisionObj };
                }
            }
        }
    }

    // Handle Excel 31-char sheet-name truncation when metadata row is absent
    if (normFull.length >= 20) {
        const prefixMatches = [];
        for (const grade of grades) {
            const gNorm = normalizeArabicText(grade.name);
            for (const div of grade.divisions || []) {
                const dNorm = normalizeArabicText(div.name);
                const dShort = stripDivisionPrefix(dNorm);
                const candidates = [
                    `${gNorm} ${dNorm}`,
                    `${gNorm} - ${dNorm}`,
                    `${gNorm}-${dNorm}`,
                    `${gNorm} ${dShort}`,
                    `${gNorm} - ${dShort}`,
                    `${gNorm}-${dShort}`,
                ];
                if (candidates.some((c) => c.startsWith(normFull))) {
                    prefixMatches.push({ gradeObj: grade, divisionObj: div });
                }
            }
        }
        if (prefixMatches.length === 1) {
            return prefixMatches[0];
        }
    }

    return { gradeObj: null, divisionObj: null };
};

export const resolveGradeAndDivision = (rawGrade, rawDivision, grades = []) => {
    const gStr = String(extractCellPrimitive(rawGrade) ?? '').trim();
    const dStr = String(extractCellPrimitive(rawDivision) ?? '').trim();

    if (gStr && dStr) {
        const gradeObj = matchGradeByText(gStr, grades);
        if (gradeObj) {
            const divisionObj = matchDivisionInGrade(dStr, gradeObj);
            return { gradeObj, divisionObj };
        }
    }

    if (gStr && !dStr) {
        const combined = tryResolveCombinedGradeDivision(gStr, grades);
        if (combined.gradeObj) return combined;
        const gradeOnly = matchGradeByText(gStr, grades);
        if (gradeOnly) {
            const singleDiv = (gradeOnly.divisions || []).length === 1 ? gradeOnly.divisions[0] : null;
            return { gradeObj: gradeOnly, divisionObj: singleDiv };
        }
    }

    if (!gStr && dStr) {
        const combined = tryResolveCombinedGradeDivision(dStr, grades);
        if (combined.gradeObj) return combined;

        // Unique division name across entire branch
        const matches = [];
        grades.forEach((g) => {
            const div = matchDivisionInGrade(dStr, g);
            if (div) matches.push({ gradeObj: g, divisionObj: div });
        });
        if (matches.length === 1) {
            return matches[0];
        }
    }

    return { gradeObj: null, divisionObj: null };
};

export const resolveTeacher = (rawTeacher, teachers = []) => {
    const rawStr = toWesternDigits(extractCellPrimitive(rawTeacher)).trim();
    if (!rawStr) {
        return { teacher: null, ambiguous: false, candidates: [] };
    }

    const rawLower = rawStr.toLowerCase();

    // Priority 1: national_id, username, or email
    const byIdentifier = teachers.find((t) => {
        const nid = t.national_id ? toWesternDigits(t.national_id).trim().toLowerCase() : '';
        const uname = t.username ? String(t.username).trim().toLowerCase() : '';
        const mail = t.email ? String(t.email).trim().toLowerCase() : '';
        return (nid && nid === rawLower) || (uname && uname === rawLower) || (mail && mail === rawLower);
    });
    if (byIdentifier) {
        return { teacher: byIdentifier, ambiguous: false, candidates: [] };
    }

    // Priority 2: exact name or display_name match (also check prefix before " - " if user pasted display_name)
    const normInput = normalizeArabicText(rawStr);
    const strippedRoleInput = rawStr.includes(' - ')
        ? normalizeArabicText(rawStr.split(' - ')[0])
        : normInput;

    const exactMatches = teachers.filter((t) => {
        const tName = normalizeArabicText(t.name);
        const tDisp = normalizeArabicText(t.display_name || '');
        return tName === normInput || (tDisp && tDisp === normInput) || tName === strippedRoleInput;
    });

    if (exactMatches.length === 1) {
        return { teacher: exactMatches[0], ambiguous: false, candidates: [] };
    }
    if (exactMatches.length > 1) {
        return { teacher: null, ambiguous: true, candidates: exactMatches };
    }

    // Priority 3: unique partial match (at least 3 chars)
    if (strippedRoleInput.length >= 3) {
        const partialMatches = teachers.filter((t) => {
            const tName = normalizeArabicText(t.name);
            return tName.includes(strippedRoleInput) || strippedRoleInput.includes(tName);
        });

        if (partialMatches.length === 1) {
            return { teacher: partialMatches[0], ambiguous: false, candidates: [] };
        }
        if (partialMatches.length > 1) {
            return { teacher: null, ambiguous: true, candidates: partialMatches };
        }
    }

    return { teacher: null, ambiguous: false, candidates: [] };
};

export const resolveSubject = (rawSubject, gradeObj, subjects = []) => {
    const norm = normalizeArabicText(extractCellPrimitive(rawSubject));
    if (!norm) return null;

    const gradeSubjectIds = (gradeObj?.subject_ids || []).map(Number);
    const gradePool = gradeSubjectIds.length > 0
        ? subjects.filter((s) => gradeSubjectIds.includes(Number(s.id)))
        : [];

    const findInPool = (pool) => {
        const exact = pool.find((s) => normalizeArabicText(s.name) === norm);
        if (exact) return exact;
        if (norm.length >= 2) {
            const partials = pool.filter((s) => {
                const sNorm = normalizeArabicText(s.name);
                return sNorm.includes(norm) || norm.includes(sNorm);
            });
            if (partials.length === 1) return partials[0];
        }
        return null;
    };

    return findInPool(gradePool) || findInPool(subjects);
};

const addReferenceSheet = (workbook, { grades, workingDays, daysTranslation, periods, subjects, teachers }) => {
    const refSheet = workbook.addWorksheet('البيانات المرجعية', {
        views: [{ rightToLeft: true }],
    });

    refSheet.columns = [
        { width: 22 }, // A: الصفوف
        { width: 28 }, // B: الشعب
        { width: 16 }, // C: أيام الدوام
        { width: 22 }, // D: الحصص
        { width: 24 }, // E: المواد
        { width: 28 }, // F: المعلمون
        { width: 34 }, // G: تفاصيل الحصص والمجموعات
        { width: 34 }, // H: معرفات المعلمين
    ];

    const headerRow = refSheet.addRow([
        'الصفوف الدراسية',
        'شعب كل صف',
        'أيام الدوام',
        'الحصص (غير الاستراحة)',
        'المواد الدراسية',
        'أسماء المعلمين',
        'تفاصيل الحصص والمجموعات',
        'معرفات المعلمين (الاسم | الهوية)',
    ]);
    headerRow.height = 24;
    headerRow.eachCell((cell) => {
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

    const dayEntries = (workingDays || []).map((d) => daysTranslation[d] || d);
    const nonBreakPeriods = (periods || []).filter((p) => !p.is_break);
    const uniquePeriodNames = [...new Set(nonBreakPeriods.map((p) => p.period_name).filter(Boolean))];
    const periodDetails = nonBreakPeriods.map((p) => {
        const timeRange = p.start_time && p.end_time ? ` (${p.start_time}-${p.end_time})` : '';
        const grp = p.group_name ? ` [${p.group_name}]` : ' [عام]';
        return `${p.period_name}${timeRange}${grp}`;
    });
    const teacherIdEntries = teachers.map((t) => {
        const identifier = t.national_id || t.username || t.email || t.id;
        return `${t.name} | ${identifier}`;
    });

    const maxLen = Math.max(
        grades.length,
        divisionEntries.length,
        dayEntries.length,
        uniquePeriodNames.length,
        subjects.length,
        teachers.length,
        periodDetails.length,
        teacherIdEntries.length
    );

    for (let i = 0; i < maxLen; i++) {
        refSheet.addRow([
            grades[i]?.name || '',
            divisionEntries[i] || '',
            dayEntries[i] || '',
            uniquePeriodNames[i] || '',
            subjects[i]?.name || '',
            teachers[i]?.name || '',
            periodDetails[i] || '',
            teacherIdEntries[i] || '',
        ]);
    }

    return {
        gradesCount: grades.length,
        daysCount: dayEntries.length,
        periodsCount: uniquePeriodNames.length,
        subjectsCount: subjects.length,
        teachersCount: teachers.length,
    };
};

export const buildFlatTimetableWorkbook = async ({
    sections = [],
    periods = [],
    subjects = [],
    teachers = [],
    workingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    daysTranslation = DAYS_TRANSLATION,
    existingSlots = null,
    schoolName = 'المدارس الذكية',
    semesterName = '',
}) => {
    const grades = flattenGradesFromSections(sections);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = schoolName;
    workbook.created = new Date();

    const mainSheet = workbook.addWorksheet('الجدول الدراسي', {
        views: [{ rightToLeft: true, state: 'frozen', ySplit: 4 }],
    });

    const refCounts = addReferenceSheet(workbook, {
        grades,
        workingDays,
        daysTranslation,
        periods,
        subjects,
        teachers,
    });

    mainSheet.columns = [
        { width: 22 }, // A: الصف الدراسي
        { width: 16 }, // B: الشعبة
        { width: 16 }, // C: اليوم
        { width: 20 }, // D: الحصة
        { width: 24 }, // E: المادة الدراسية
        { width: 32 }, // F: المعلم
    ];

    mainSheet.mergeCells('A1:F1');
    const titleCell = mainSheet.getCell('A1');
    titleCell.value = `${schoolName}${semesterName ? ` - ${semesterName}` : ''} | الجدول الدراسي`;
    titleCell.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FF1E293B' } };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    mainSheet.getRow(1).height = 28;

    mainSheet.mergeCells('A2:F2');
    const hintCell = mainSheet.getCell('A2');
    hintCell.value =
        'أدخل الحصص بدءاً من الصف 5. يمكن كتابة اسم المعلم أو رقم الهوية/اسم المستخدم/البريد. راجع ورقة "البيانات المرجعية" للأسماء المعتمدة.';
    hintCell.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF475569' } };
    hintCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
    hintCell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    mainSheet.getRow(2).height = 24;
    mainSheet.getRow(3).height = 8;

    const headerRow = mainSheet.getRow(4);
    headerRow.values = [
        'الصف الدراسي',
        'الشعبة',
        'اليوم',
        'الحصة',
        'المادة الدراسية',
        'المعلم (الاسم أو الهوية/البريد)',
    ];
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
    if (Array.isArray(existingSlots) && existingSlots.length > 0) {
        const dayOrder = Object.keys(DAYS_TRANSLATION);
        const periodOrderMap = new Map(periods.map((p, idx) => [Number(p.id), idx]));

        const sortedSlots = [...existingSlots].sort((a, b) => {
            const cmpGrade = String(a.grade_name || '').localeCompare(String(b.grade_name || ''), 'ar');
            if (cmpGrade !== 0) return cmpGrade;
            const cmpDiv = String(a.division_name || '').localeCompare(String(b.division_name || ''), 'ar');
            if (cmpDiv !== 0) return cmpDiv;
            const cmpDay = dayOrder.indexOf(a.day_of_week) - dayOrder.indexOf(b.day_of_week);
            if (cmpDay !== 0) return cmpDay;
            return (periodOrderMap.get(Number(a.period_id)) ?? 99) - (periodOrderMap.get(Number(b.period_id)) ?? 99);
        });

        sortedSlots.forEach((slot) => {
            dataRows.push([
                slot.grade_name || '',
                slot.division_name || '',
                daysTranslation[slot.day_of_week] || slot.day_of_week || '',
                slot.period_name || '',
                slot.subject_name || '',
                slot.teacher_name || '',
            ]);
        });
    } else {
        const sampleGrade = grades.find((g) => (g.divisions || []).length > 0) || grades[0];
        const sampleDiv = sampleGrade?.divisions?.[0]?.name || 'أ';
        const samplePeriods = getAllowedPeriodsForGrade(sampleGrade, periods, false);
        const p1 = samplePeriods[0]?.period_name || 'الحصة الأولى';
        const p2 = samplePeriods[1]?.period_name || 'الحصة الثانية';
        const sampleDay = daysTranslation[workingDays[0] || 'Sunday'] || 'الأحد';
        const sampleSubj1 = subjects.find((s) => sampleGrade?.subject_ids?.includes(Number(s.id)))?.name || subjects[0]?.name || 'الرياضيات';
        const sampleSubj2 = subjects[1]?.name || sampleSubj1;
        const sampleTeacher = teachers[0]?.name || '';

        dataRows.push([sampleGrade?.name || 'الأول المتوسط', sampleDiv, sampleDay, p1, sampleSubj1, sampleTeacher]);
        dataRows.push([sampleGrade?.name || 'الأول المتوسط', sampleDiv, sampleDay, p2, sampleSubj2, sampleTeacher]);
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

    const maxValidationRow = Math.max(500, dataRows.length + 50);
    const gradeFormula = refCounts.gradesCount > 0 ? `'البيانات المرجعية'!$A$2:$A$${refCounts.gradesCount + 1}` : null;
    const dayFormula = refCounts.daysCount > 0 ? `'البيانات المرجعية'!$C$2:$C$${refCounts.daysCount + 1}` : null;
    const periodFormula = refCounts.periodsCount > 0 ? `'البيانات المرجعية'!$D$2:$D$${refCounts.periodsCount + 1}` : null;
    const subjectFormula = refCounts.subjectsCount > 0 ? `'البيانات المرجعية'!$E$2:$E$${refCounts.subjectsCount + 1}` : null;
    const teacherFormula = refCounts.teachersCount > 0 ? `'البيانات المرجعية'!$F$2:$F$${refCounts.teachersCount + 1}` : null;

    for (let r = 5; r <= maxValidationRow; r++) {
        if (gradeFormula) {
            mainSheet.getCell(`A${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [gradeFormula] };
        }
        if (dayFormula) {
            mainSheet.getCell(`C${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [dayFormula] };
        }
        if (periodFormula) {
            mainSheet.getCell(`D${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [periodFormula] };
        }
        if (subjectFormula) {
            mainSheet.getCell(`E${r}`).dataValidation = { type: 'list', allowBlank: true, formulae: [subjectFormula] };
        }
        if (teacherFormula) {
            mainSheet.getCell(`F${r}`).dataValidation = {
                type: 'list',
                allowBlank: true,
                errorStyle: 'information',
                showErrorMessage: false,
                formulae: [teacherFormula],
            };
        }
    }

    return workbook;
};

const sanitizeSheetName = (rawName, usedNames) => {
    const cleaned = String(rawName || 'شعبة')
        .replace(/[\\/*?:[\]]/g, '-')
        .trim() || 'شعبة';
    let candidate = cleaned.slice(0, 31);
    let counter = 2;
    while (usedNames.has(candidate.toLowerCase())) {
        const suffix = ` (${counter})`;
        candidate = `${cleaned.slice(0, 31 - suffix.length)}${suffix}`;
        counter++;
    }
    usedNames.add(candidate.toLowerCase());
    return candidate;
};

export const buildGridTimetableWorkbook = async ({
    sections = [],
    periods = [],
    subjects = [],
    teachers = [],
    workingDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
    daysTranslation = DAYS_TRANSLATION,
    existingSlots = null,
    divisionIds = null,
    schoolName = 'المدارس الذكية',
    semesterName = '',
}) => {
    const grades = flattenGradesFromSections(sections);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = schoolName;
    workbook.created = new Date();

    const targetDivisions = [];
    const filterSet = Array.isArray(divisionIds) && divisionIds.length > 0
        ? new Set(divisionIds.map(Number))
        : null;

    grades.forEach((grade) => {
        (grade.divisions || []).forEach((div) => {
            if (!filterSet || filterSet.has(Number(div.id))) {
                targetDivisions.push({ grade, division: div });
            }
        });
    });

    if (targetDivisions.length === 0) {
        targetDivisions.push({
            grade: { id: 0, name: 'الأول المتوسط', subject_ids: [], timetable_group_ids: [] },
            division: { id: 0, name: 'أ' },
        });
    }

    const slotLookup = new Map();
    if (Array.isArray(existingSlots)) {
        existingSlots.forEach((slot) => {
            slotLookup.set(`${slot.division_id}_${slot.day_of_week}_${slot.period_id}`, slot);
        });
    }

    const usedSheetNames = new Set(['البيانات المرجعية']);

    targetDivisions.forEach(({ grade, division }, sheetIndex) => {
        const sheetName = sanitizeSheetName(`${grade.name} - ${division.name}`, usedSheetNames);
        const ws = workbook.addWorksheet(sheetName, {
            views: [{ rightToLeft: true, state: 'frozen', xSplit: 1, ySplit: 3 }],
        });

        const gradePeriods = getAllowedPeriodsForGrade(grade, periods, false);
        const colsCount = Math.max(2, gradePeriods.length + 1);
        const lastColLetter = ws.getColumn(colsCount).letter;

        ws.columns = [
            { width: 16 },
            ...gradePeriods.map(() => ({ width: 26 })),
        ];

        ws.mergeCells(`A1:${lastColLetter}1`);
        const titleCell = ws.getCell('A1');
        titleCell.value = `${schoolName}${semesterName ? ` - ${semesterName}` : ''}`;
        titleCell.font = { name: 'Segoe UI', size: 13, bold: true, color: { argb: 'FF1E293B' } };
        titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(1).height = 24;

        ws.mergeCells(`A2:${lastColLetter}2`);
        const metaCell = ws.getCell('A2');
        metaCell.value = `الصف: ${grade.name} | الشعبة: ${division.name} — اكتب في كل خلية: المادة / المعلم`;
        metaCell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FF475569' } };
        metaCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
        metaCell.alignment = { horizontal: 'center', vertical: 'middle' };
        ws.getRow(2).height = 22;

        const headerRow = ws.getRow(3);
        headerRow.values = [
            'اليوم',
            ...gradePeriods.map((p) => {
                const timePart = p.start_time && p.end_time ? ` (${p.start_time}-${p.end_time})` : '';
                return `${p.period_name}${timePart}`;
            }),
        ];
        headerRow.height = 26;
        headerRow.eachCell((cell) => {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6B9B37' } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });

        workingDays.forEach((day, dIdx) => {
            const rowVals = [daysTranslation[day] || day];
            gradePeriods.forEach((period, pIdx) => {
                const existing = slotLookup.get(`${division.id}_${day}_${period.id}`);
                if (existing) {
                    rowVals.push(`${existing.subject_name} / ${existing.teacher_name}`);
                } else if ((!existingSlots || existingSlots.length === 0) && sheetIndex === 0 && dIdx === 0 && pIdx === 0) {
                    const sName = subjects.find((s) => grade.subject_ids?.includes(Number(s.id)))?.name || subjects[0]?.name || 'الرياضيات';
                    const tName = teachers[0]?.name || 'اسم المعلم';
                    rowVals.push(`${sName} / ${tName}`);
                } else {
                    rowVals.push('');
                }
            });

            const r = ws.getRow(4 + dIdx);
            r.values = rowVals;
            r.height = 28;
            r.eachCell((cell, colNum) => {
                cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                cell.font = { name: 'Segoe UI', size: 10, bold: colNum === 1 };
                if (colNum === 1) {
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
                }
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                    right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
                };
            });
        });
    });

    addReferenceSheet(workbook, {
        grades,
        workingDays,
        daysTranslation,
        periods,
        subjects,
        teachers,
    });

    return workbook;
};

const triggerWorkbookDownload = async (workbook, filename) => {
    const buffer = await workbook.xlsx.writeBuffer();
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

export const downloadFlatTimetableTemplate = async (params) => {
    const workbook = await buildFlatTimetableWorkbook(params);
    const isExport = Array.isArray(params.existingSlots) && params.existingSlots.length > 0;
    const prefix = isExport ? 'تصدير_الجدول_الدراسي' : 'قالب_استيراد_الجدول_مسطح';
    await triggerWorkbookDownload(workbook, `${prefix}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};

export const downloadGridTimetableTemplate = async (params) => {
    const workbook = await buildGridTimetableWorkbook(params);
    const isExport = Array.isArray(params.existingSlots) && params.existingSlots.length > 0;
    const prefix = isExport ? 'تصدير_الجدول_الشبكي' : 'قالب_استيراد_الجدول_شبكي';
    await triggerWorkbookDownload(workbook, `${prefix}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};

const detectFlatHeaderMap = (rowValues) => {
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

    const coreHits = ['day', 'period', 'subject'].filter((f) => map[f] !== undefined).length;
    const totalHits = Object.keys(map).length;
    return coreHits >= 2 && totalHits >= 3 ? map : null;
};

const detectGridHeaderRow = (matrixRows) => {
    const scanLimit = Math.min(10, matrixRows.length);
    for (let r = 0; r < scanLimit; r++) {
        const row = matrixRows[r] || [];
        for (let c = 0; c < Math.min(3, row.length); c++) {
            const norm = normalizeArabicText(extractCellPrimitive(row[c]));
            if (norm === 'اليوم' || norm === 'day' || norm === 'اليوم / الحصه' || norm === 'اليوم/الحصه') {
                const nonEmptyHeadersAfter = row.slice(c + 1).filter((v) => String(extractCellPrimitive(v)).trim() !== '').length;
                if (nonEmptyHeadersAfter >= 1) {
                    return { headerRowIndex: r, dayColIndex: c };
                }
            }
        }
    }
    return null;
};

const generateSubjectTeacherCandidates = (rawCellText) => {
    const text = String(rawCellText ?? '').trim();
    if (!text) return [];

    const candidates = [];
    const seen = new Set();
    const pushCandidate = (rawSubject, rawTeacher) => {
        const s = rawSubject.trim();
        const t = rawTeacher.trim();
        const key = `${s}\u0000${t}`;
        if (!seen.has(key)) {
            seen.add(key);
            candidates.push({ rawSubject: s, rawTeacher: t });
        }
    };

    if (text.includes('\n')) {
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        for (let i = 1; i < lines.length; i++) {
            pushCandidate(lines.slice(0, i).join(' '), lines.slice(i).join(' '));
        }
    }

    for (const sep of ['/', '|', ' - ']) {
        if (!text.includes(sep)) continue;
        const parts = text.split(sep).map((p) => p.trim()).filter(Boolean);
        for (let i = 1; i < parts.length; i++) {
            pushCandidate(parts.slice(0, i).join(sep === ' - ' ? ' - ' : ` ${sep} `), parts.slice(i).join(sep === ' - ' ? ' - ' : ` ${sep} `));
        }
    }

    const parenMatch = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
    if (parenMatch) {
        pushCandidate(parenMatch[1], parenMatch[2]);
    }

    if (candidates.length === 0) {
        pushCandidate(text, '');
    }

    return candidates;
};

const resolveSubjectTeacherCell = (rawCellText, gradeObj, subjects, teachers) => {
    const candidates = generateSubjectTeacherCandidates(rawCellText);
    if (candidates.length === 0) {
        return {
            rawSubject: '',
            rawTeacher: '',
            subjectObj: null,
            teacherRes: { teacher: null, ambiguous: false, candidates: [] },
        };
    }

    let best = null;
    let bestScore = -1;

    for (const cand of candidates) {
        const subjectObj = resolveSubject(cand.rawSubject, gradeObj, subjects);
        const teacherRes = resolveTeacher(cand.rawTeacher, teachers);
        const score = (subjectObj ? 2 : 0) + (teacherRes.teacher ? 2 : teacherRes.ambiguous ? 1 : 0);

        if (score > bestScore) {
            bestScore = score;
            best = { ...cand, subjectObj, teacherRes };
            if (score === 4) break;
        }
    }

    return best;
};

const makeRowObject = ({
    rowKey,
    sourceRowNumber,
    sheetName,
    gradeObj,
    rawGrade,
    divisionObj,
    rawDivision,
    dayOfWeek,
    rawDay,
    periodRes,
    rawPeriod,
    subjectObj,
    rawSubject,
    teacherRes,
    rawTeacher,
}) => ({
    rowKey,
    sourceRowNumber,
    sheetName,
    grade_id: gradeObj?.id ? Number(gradeObj.id) : '',
    raw_grade: rawGrade,
    division_id: divisionObj?.id ? Number(divisionObj.id) : '',
    raw_division: rawDivision,
    day_of_week: dayOfWeek,
    raw_day: rawDay,
    period_id: periodRes?.period?.id ? Number(periodRes.period.id) : '',
    raw_period: rawPeriod,
    period_is_break: Boolean(periodRes?.isBreak),
    period_out_of_group: Boolean(periodRes?.outOfGroup),
    subject_id: subjectObj?.id ? Number(subjectObj.id) : '',
    raw_subject: rawSubject,
    teacher_id: teacherRes?.teacher?.id ? Number(teacherRes.teacher.id) : '',
    raw_teacher: rawTeacher,
    teacher_ambiguous: Boolean(teacherRes?.ambiguous),
    teacher_candidates: (teacherRes?.candidates || []).map((c) => c.name),
});

const parseFlatMatrix = (matrixRows, sheetName, { grades, periods, subjects, teachers }) => {
    let headerMap = null;
    let headerRowIndex = -1;

    const scanLimit = Math.min(10, matrixRows.length);
    for (let i = 0; i < scanLimit; i++) {
        const candidate = detectFlatHeaderMap(matrixRows[i] || []);
        if (candidate) {
            headerMap = candidate;
            headerRowIndex = i;
            break;
        }
    }

    if (!headerMap) {
        return null;
    }

    const parsedRows = [];
    for (let r = headerRowIndex + 1; r < matrixRows.length; r++) {
        const rowArr = matrixRows[r] || [];
        const nonEmpty = rowArr.some((v) => String(extractCellPrimitive(v)).trim() !== '');
        if (!nonEmpty) continue;

        const rawGrade = headerMap.grade !== undefined ? String(extractCellPrimitive(rowArr[headerMap.grade]) ?? '').trim() : '';
        const rawDivision = headerMap.division !== undefined ? String(extractCellPrimitive(rowArr[headerMap.division]) ?? '').trim() : '';
        const rawDay = headerMap.day !== undefined ? String(extractCellPrimitive(rowArr[headerMap.day]) ?? '').trim() : '';
        const rawPeriod = headerMap.period !== undefined ? String(extractCellPrimitive(rowArr[headerMap.period]) ?? '').trim() : '';
        const rawSubject = headerMap.subject !== undefined ? String(extractCellPrimitive(rowArr[headerMap.subject]) ?? '').trim() : '';
        const rawTeacher = headerMap.teacher !== undefined ? String(extractCellPrimitive(rowArr[headerMap.teacher]) ?? '').trim() : '';

        const { gradeObj, divisionObj } = resolveGradeAndDivision(rawGrade, rawDivision, grades);
        const dayOfWeek = normalizeDayOfWeek(rawDay);
        const periodRes = resolvePeriodForGrade(rawPeriod, gradeObj, periods);
        const subjectObj = resolveSubject(rawSubject, gradeObj, subjects);
        const teacherRes = resolveTeacher(rawTeacher, teachers);

        parsedRows.push(
            makeRowObject({
                rowKey: `flat_${sheetName}_${r}_${Math.random().toString(36).slice(2, 7)}`,
                sourceRowNumber: r + 1,
                sheetName,
                gradeObj,
                rawGrade,
                divisionObj,
                rawDivision,
                dayOfWeek,
                rawDay,
                periodRes,
                rawPeriod,
                subjectObj,
                rawSubject,
                teacherRes,
                rawTeacher,
            })
        );
    }

    return parsedRows;
};

const extractGridMetadata = (matrixRows, headerRowIndex, sheetName, grades) => {
    let metaGrade = '';
    let metaDivision = '';

    for (let r = 0; r < headerRowIndex; r++) {
        const lineText = (matrixRows[r] || [])
            .map((v) => String(extractCellPrimitive(v) ?? '').trim())
            .filter(Boolean)
            .join(' | ');
        if (!lineText) continue;

        const bothMatch = lineText.match(/الصف\s*:\s*([^|—]+)\|\s*الشعبة\s*:\s*([^|—]+)/u);
        if (bothMatch) {
            metaGrade = bothMatch[1].trim();
            metaDivision = bothMatch[2].trim();
            break;
        }

        const gMatch = lineText.match(/الصف\s*:\s*([^|—]+)/u);
        const dMatch = lineText.match(/الشعبة\s*:\s*([^|—]+)/u);
        if (gMatch) metaGrade = gMatch[1].trim();
        if (dMatch) metaDivision = dMatch[1].trim();
    }

    if (metaGrade || metaDivision) {
        const resolved = resolveGradeAndDivision(metaGrade, metaDivision, grades);
        if (resolved.gradeObj) {
            return { ...resolved, rawGrade: metaGrade, rawDivision: metaDivision };
        }
    }

    const fromSheet = resolveGradeAndDivision(sheetName, '', grades);
    return {
        ...fromSheet,
        rawGrade: metaGrade || sheetName,
        rawDivision: metaDivision || sheetName,
    };
};

const parseGridMatrix = (matrixRows, sheetName, { grades, periods, subjects, teachers }) => {
    const detected = detectGridHeaderRow(matrixRows);
    if (!detected) return null;

    const { headerRowIndex, dayColIndex } = detected;
    const { gradeObj, divisionObj, rawGrade, rawDivision } = extractGridMetadata(
        matrixRows,
        headerRowIndex,
        sheetName,
        grades
    );

    const headerRow = matrixRows[headerRowIndex] || [];
    const colPeriods = [];
    for (let c = dayColIndex + 1; c < headerRow.length; c++) {
        const rawHeader = String(extractCellPrimitive(headerRow[c]) ?? '').trim();
        if (!rawHeader) continue;
        colPeriods.push({
            colIndex: c,
            rawPeriod: rawHeader,
            periodRes: resolvePeriodForGrade(rawHeader, gradeObj, periods),
        });
    }

    const parsedRows = [];
    for (let r = headerRowIndex + 1; r < matrixRows.length; r++) {
        const rowArr = matrixRows[r] || [];
        const rawDay = String(extractCellPrimitive(rowArr[dayColIndex]) ?? '').trim();
        const dayOfWeek = normalizeDayOfWeek(rawDay);

        const hasSlotContent = colPeriods.some(({ colIndex }) => String(extractCellPrimitive(rowArr[colIndex]) ?? '').trim() !== '');
        if (!rawDay && !hasSlotContent) continue;
        if (!dayOfWeek && !hasSlotContent) continue;

        colPeriods.forEach(({ colIndex, rawPeriod, periodRes }) => {
            const rawCell = String(extractCellPrimitive(rowArr[colIndex]) ?? '').trim();
            if (!rawCell) return;

            const { rawSubject, rawTeacher, subjectObj, teacherRes } = resolveSubjectTeacherCell(
                rawCell,
                gradeObj,
                subjects,
                teachers
            );

            parsedRows.push(
                makeRowObject({
                    rowKey: `grid_${sheetName}_${r}_${colIndex}_${Math.random().toString(36).slice(2, 7)}`,
                    sourceRowNumber: r + 1,
                    sheetName,
                    gradeObj,
                    rawGrade,
                    divisionObj,
                    rawDivision,
                    dayOfWeek,
                    rawDay,
                    periodRes,
                    rawPeriod,
                    subjectObj,
                    rawSubject,
                    teacherRes,
                    rawTeacher,
                })
            );
        });
    }

    return parsedRows;
};

const parseMatrixByAutoDetect = (matrixRows, sheetName, context) => {
    const flatRows = parseFlatMatrix(matrixRows, sheetName, context);
    if (flatRows !== null) {
        return { format: 'flat', rows: flatRows };
    }

    const gridRows = parseGridMatrix(matrixRows, sheetName, context);
    if (gridRows !== null) {
        return { format: 'grid', rows: gridRows };
    }

    // Last-resort positional fallback A..F (if user deleted header row in flat sheet)
    const fallbackRows = [];
    for (let r = 0; r < matrixRows.length; r++) {
        const rowArr = matrixRows[r] || [];
        const nonEmpty = rowArr.some((v) => String(extractCellPrimitive(v)).trim() !== '');
        if (!nonEmpty) continue;

        const rawGrade = String(extractCellPrimitive(rowArr[0]) ?? '').trim();
        const rawDivision = String(extractCellPrimitive(rowArr[1]) ?? '').trim();
        const rawDay = String(extractCellPrimitive(rowArr[2]) ?? '').trim();
        const rawPeriod = String(extractCellPrimitive(rowArr[3]) ?? '').trim();
        const rawSubject = String(extractCellPrimitive(rowArr[4]) ?? '').trim();
        const rawTeacher = String(extractCellPrimitive(rowArr[5]) ?? '').trim();

        const { gradeObj, divisionObj } = resolveGradeAndDivision(rawGrade, rawDivision, context.grades);
        const dayOfWeek = normalizeDayOfWeek(rawDay);
        const periodRes = resolvePeriodForGrade(rawPeriod, gradeObj, context.periods);
        const subjectObj = resolveSubject(rawSubject, gradeObj, context.subjects);
        const teacherRes = resolveTeacher(rawTeacher, context.teachers);

        fallbackRows.push(
            makeRowObject({
                rowKey: `pos_${sheetName}_${r}_${Math.random().toString(36).slice(2, 7)}`,
                sourceRowNumber: r + 1,
                sheetName,
                gradeObj,
                rawGrade,
                divisionObj,
                rawDivision,
                dayOfWeek,
                rawDay,
                periodRes,
                rawPeriod,
                subjectObj,
                rawSubject,
                teacherRes,
                rawTeacher,
            })
        );
    }

    return { format: 'flat', rows: fallbackRows };
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

const prepareParsingContext = (context = {}) => ({
    grades: context.grades || flattenGradesFromSections(context.sections || []),
    periods: context.periods || [],
    subjects: context.subjects || [],
    teachers: context.teachers || [],
});

export const parseTimetableCsvText = (csvText, rawContext) => {
    const context = prepareParsingContext(rawContext);
    const cleanText = String(csvText || '').replace(/^\uFEFF/, '');
    const lines = cleanText.split(/\r?\n/).filter((l) => l.trim() !== '');
    const firstLine = lines[0] || '';
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';
    const matrix = lines.map((line) => parseCsvLine(line, delimiter));
    const parsed = parseMatrixByAutoDetect(matrix, 'CSV', context);
    return {
        rows: parsed.rows,
        format: parsed.format,
        sheetCount: 1,
    };
};

export const parseTimetableWorkbookBuffer = async (arrayBuffer, rawContext) => {
    const context = prepareParsingContext(rawContext);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(arrayBuffer);

    const allRows = [];
    const formatsDetected = new Set();
    let sheetCount = 0;

    workbook.worksheets.forEach((sheet) => {
        const sheetNorm = normalizeArabicText(sheet.name);
        if (sheetNorm.includes('البيانات المرجعيه') || sheetNorm === 'reference' || sheetNorm.includes('ملاحظات')) {
            return;
        }

        const matrix = [];
        sheet.eachRow({ includeEmpty: false }, (row) => {
            const rowArr = [];
            const colMax = Math.max(6, row.cellCount);
            for (let c = 1; c <= colMax; c++) {
                rowArr.push(row.getCell(c).value);
            }
            matrix.push(rowArr);
        });

        if (matrix.length === 0) return;

        const parsed = parseMatrixByAutoDetect(matrix, sheet.name, context);
        if (parsed.rows.length > 0) {
            allRows.push(...parsed.rows);
            formatsDetected.add(parsed.format);
            sheetCount++;
        }
    });

    return {
        rows: allRows,
        format: formatsDetected.size === 1 ? [...formatsDetected][0] : 'mixed',
        sheetCount,
    };
};

export const parseTimetableFile = async (file, context) => {
    const name = (file?.name || '').toLowerCase();
    if (name.endsWith('.csv')) {
        const text = await file.text();
        return parseTimetableCsvText(text, context);
    }
    const buffer = await file.arrayBuffer();
    return parseTimetableWorkbookBuffer(buffer, context);
};

export const validateTimetableRows = (
    rows = [],
    context = {},
    { mode = 'merge', scope = 'file_divisions', scopeId = null } = {}
) => {
    const grades = context.grades || flattenGradesFromSections(context.sections || []);
    const periods = context.periods || [];
    const subjects = context.subjects || [];
    const teachers = context.teachers || [];
    const workingDays = context.working_days || Object.keys(DAYS_TRANSLATION);
    const existingSlots = context.existing_slots || [];
    const dstList = context.division_subject_teachers || [];

    const gradeMap = new Map(grades.map((g) => [Number(g.id), g]));
    const divisionMap = new Map();
    grades.forEach((g) => {
        (g.divisions || []).forEach((d) => {
            divisionMap.set(Number(d.id), { ...d, grade: g });
        });
    });
    const periodMap = new Map(periods.map((p) => [Number(p.id), p]));
    const subjectMap = new Map(subjects.map((s) => [Number(s.id), s]));
    const teacherMap = new Map(teachers.map((t) => [Number(t.id), t]));

    const dstMap = new Map();
    dstList.forEach((dst) => {
        const key = `${dst.division_id}_${dst.subject_id}`;
        if (!dstMap.has(key)) dstMap.set(key, new Set());
        dstMap.get(key).add(Number(dst.teacher_id));
    });

    // Compute divisions that will be wiped in replace mode
    const replacedDivisionIds = new Set();
    if (mode === 'replace') {
        if (scope === 'file_divisions') {
            rows.forEach((r) => {
                if (r.division_id && divisionMap.has(Number(r.division_id))) {
                    replacedDivisionIds.add(Number(r.division_id));
                }
            });
        } else if (scope === 'division' && scopeId && divisionMap.has(Number(scopeId))) {
            replacedDivisionIds.add(Number(scopeId));
        } else if (scope === 'grade' && scopeId) {
            const g = gradeMap.get(Number(scopeId));
            (g?.divisions || []).forEach((d) => replacedDivisionIds.add(Number(d.id)));
        } else if (scope === 'section' && scopeId) {
            grades
                .filter((g) => Number(g.section_id) === Number(scopeId))
                .forEach((g) => (g.divisions || []).forEach((d) => replacedDivisionIds.add(Number(d.id))));
        } else if (scope === 'branch') {
            divisionMap.forEach((_, divId) => replacedDivisionIds.add(divId));
        }
    }

    // Track incoming division slots (for merge overwrite detection & DB conflict exclusion)
    const incomingSlotKeys = new Set();
    rows.forEach((r) => {
        if (r.division_id && r.day_of_week && r.period_id) {
            incomingSlotKeys.add(`${r.division_id}_${r.day_of_week}_${r.period_id}`);
        }
    });

    const existingSlotSet = new Set();
    const remainingDbTeacherMap = new Map();
    existingSlots.forEach((ex) => {
        const divId = Number(ex.division_id);
        const key = `${divId}_${ex.day_of_week}_${ex.period_id}`;
        existingSlotSet.add(key);

        if (replacedDivisionIds.has(divId)) return;
        if (mode === 'merge' && incomingSlotKeys.has(key)) return;

        const tKey = `${ex.teacher_id}_${ex.day_of_week}_${ex.period_id}`;
        if (!remainingDbTeacherMap.has(tKey)) {
            remainingDbTeacherMap.set(tKey, []);
        }
        remainingDbTeacherMap.get(tKey).push(ex);
    });

    // Track occurrences inside file
    const fileDivSlotCounts = new Map();
    const fileTeacherSlotCounts = new Map();
    rows.forEach((r) => {
        if (r.division_id && r.day_of_week && r.period_id) {
            const dKey = `${r.division_id}_${r.day_of_week}_${r.period_id}`;
            fileDivSlotCounts.set(dKey, (fileDivSlotCounts.get(dKey) || 0) + 1);
        }
        if (r.teacher_id && r.day_of_week && r.period_id) {
            const tKey = `${r.teacher_id}_${r.day_of_week}_${r.period_id}`;
            if (!fileTeacherSlotCounts.has(tKey)) fileTeacherSlotCounts.set(tKey, new Set());
            fileTeacherSlotCounts.get(tKey).add(Number(r.division_id || 0));
        }
    });

    const workingDaySet = new Set(workingDays);
    let willOverwrite = 0;
    const divisionSet = new Set();

    const validatedRows = rows.map((row) => {
        const errors = [];
        const warnings = [];

        const divObj = row.division_id ? divisionMap.get(Number(row.division_id)) : null;
        const gradeObj = divObj ? divObj.grade : row.grade_id ? gradeMap.get(Number(row.grade_id)) : null;
        const periodObj = row.period_id ? periodMap.get(Number(row.period_id)) : null;
        const subjectObj = row.subject_id ? subjectMap.get(Number(row.subject_id)) : null;
        const teacherObj = row.teacher_id ? teacherMap.get(Number(row.teacher_id)) : null;

        if (!gradeObj) {
            errors.push(`الصف الدراسي غير معروف${row.raw_grade ? ` (${row.raw_grade})` : ''}.`);
        }
        if (!divObj) {
            errors.push(`الشعبة غير موجودة${row.raw_division ? ` (${row.raw_division})` : ''}.`);
        }

        if (!row.day_of_week) {
            errors.push(`اليوم غير صالح${row.raw_day ? ` (${row.raw_day})` : ''}.`);
        } else if (!workingDaySet.has(row.day_of_week)) {
            errors.push(`اليوم (${DAYS_TRANSLATION[row.day_of_week] || row.day_of_week}) ليس ضمن أيام الدوام.`);
        }

        if (row.period_is_break || periodObj?.is_break) {
            errors.push(`لا يمكن إسناد فترة راحة/فسحة${row.raw_period ? ` (${row.raw_period})` : ''}.`);
        } else if (row.period_out_of_group) {
            errors.push(`الحصة (${row.raw_period}) لا تنتمي لمجموعة توقيت الصف.`);
        } else if (!periodObj) {
            errors.push(`الحصة غير معروفة${row.raw_period ? ` (${row.raw_period})` : ''}.`);
        } else if (
            gradeObj &&
            periodObj.timetable_group_id !== null &&
            periodObj.timetable_group_id !== undefined &&
            !gradeObj.timetable_group_ids.includes(Number(periodObj.timetable_group_id))
        ) {
            errors.push(`الحصة (${periodObj.period_name}) لا تنتمي لمجموعة توقيت الصف (${gradeObj.name}).`);
        }

        if (!subjectObj) {
            errors.push(`المادة غير موجودة${row.raw_subject ? ` (${row.raw_subject})` : ''}.`);
        }

        if (row.teacher_ambiguous && !teacherObj) {
            const cands = (row.teacher_candidates || []).slice(0, 3).join('، ');
            errors.push(`اسم المعلم (${row.raw_teacher}) متطابق مع أكثر من معلم${cands ? ` (${cands})` : ''}. استخدم الرقم الوظيفي/الهوية.`);
        } else if (!teacherObj) {
            errors.push(`المعلم غير موجود${row.raw_teacher ? ` (${row.raw_teacher})` : ''}.`);
        }

        if (
            mode === 'replace' &&
            ['division', 'grade', 'section'].includes(scope) &&
            divObj &&
            !replacedDivisionIds.has(Number(divObj.id))
        ) {
            errors.push('هذه الشعبة خارج نطاق الاستبدال المحدد.');
        }

        if (divObj && row.day_of_week && periodObj) {
            const dKey = `${divObj.id}_${row.day_of_week}_${periodObj.id}`;
            if ((fileDivSlotCounts.get(dKey) || 0) > 1) {
                errors.push('خانة مكررة لنفس الشعبة واليوم والحصة داخل الملف.');
            }
        }

        if (teacherObj && row.day_of_week && periodObj && divObj) {
            const tKey = `${teacherObj.id}_${row.day_of_week}_${periodObj.id}`;
            const fileDivs = fileTeacherSlotCounts.get(tKey);
            if (fileDivs && fileDivs.size > 1) {
                errors.push(`تعارض داخل الملف: المعلم (${teacherObj.name}) مسند لأكثر من شعبة في نفس الوقت.`);
            }

            const dbConflicts = (remainingDbTeacherMap.get(tKey) || []).filter(
                (ex) => Number(ex.division_id) !== Number(divObj.id)
            );
            if (dbConflicts.length > 0) {
                const c = dbConflicts[0];
                const label = `${c.grade_name ? `${c.grade_name} - ` : ''}${c.division_name || ''}`.trim();
                errors.push(`تعارض مع الجدول الحالي: المعلم (${teacherObj.name}) لديه حصة في (${label}).`);
            }
        }

        // Warnings
        if (gradeObj && subjectObj && gradeObj.subject_ids.length > 0 && !gradeObj.subject_ids.includes(Number(subjectObj.id))) {
            warnings.push(`المادة (${subjectObj.name}) غير مسجلة ضمن مواد الصف (${gradeObj.name}).`);
        }

        if (divObj && subjectObj && teacherObj) {
            const assignedSet = dstMap.get(`${divObj.id}_${subjectObj.id}`);
            if (assignedSet && assignedSet.size > 0 && !assignedSet.has(Number(teacherObj.id))) {
                warnings.push('المعلم يختلف عن المعلم المُسند للمادة في هذه الشعبة.');
            }
        }

        const slotKey = divObj && row.day_of_week && periodObj ? `${divObj.id}_${row.day_of_week}_${periodObj.id}` : '';
        const rowOverwrites = mode === 'merge' && slotKey && existingSlotSet.has(slotKey);
        if (errors.length === 0) {
            if (rowOverwrites) willOverwrite++;
            if (divObj) divisionSet.add(Number(divObj.id));
        }

        const status = errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid';
        return {
            ...row,
            grade_id: gradeObj ? Number(gradeObj.id) : '',
            division_id: divObj ? Number(divObj.id) : '',
            period_id: periodObj && !periodObj.is_break ? Number(periodObj.id) : '',
            subject_id: subjectObj ? Number(subjectObj.id) : '',
            teacher_id: teacherObj ? Number(teacherObj.id) : '',
            willOverwrite: Boolean(rowOverwrites),
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
        willOverwrite,
        divisionsCount: divisionSet.size,
    };

    return { rows: validatedRows, stats };
};

export const downloadTimetableErrorReport = async (validatedRows = [], context = {}) => {
    const grades = context.grades || flattenGradesFromSections(context.sections || []);
    const periods = context.periods || [];
    const subjects = context.subjects || [];
    const teachers = context.teachers || [];

    const gradeMap = new Map(grades.map((g) => [Number(g.id), g.name]));
    const divisionMap = new Map();
    grades.forEach((g) => (g.divisions || []).forEach((d) => divisionMap.set(Number(d.id), d.name)));
    const periodMap = new Map(periods.map((p) => [Number(p.id), p.period_name]));
    const subjectMap = new Map(subjects.map((s) => [Number(s.id), s.name]));
    const teacherMap = new Map(teachers.map((t) => [Number(t.id), t.name]));

    const targetRows = validatedRows.filter((r) => r.status === 'error' || r.status === 'warning');
    const rowsToExport = targetRows.length > 0 ? targetRows : validatedRows;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('تقرير أخطاء الاستيراد', {
        views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }],
    });

    sheet.columns = [
        { width: 12 },
        { width: 12 },
        { width: 20 },
        { width: 14 },
        { width: 14 },
        { width: 18 },
        { width: 20 },
        { width: 24 },
        { width: 45 },
        { width: 40 },
    ];

    const header = sheet.addRow([
        'رقم الصف',
        'الحالة',
        'الصف الدراسي',
        'الشعبة',
        'اليوم',
        'الحصة',
        'المادة',
        'المعلم',
        'الأخطاء',
        'التنبيهات',
    ]);
    header.height = 26;
    header.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
        cell.font = { name: 'Segoe UI', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    rowsToExport.forEach((row) => {
        const statusLabel = row.status === 'error' ? 'خطأ' : row.status === 'warning' ? 'تنبيه' : 'جاهز';
        const r = sheet.addRow([
            row.sourceRowNumber,
            statusLabel,
            gradeMap.get(Number(row.grade_id)) || row.raw_grade || '',
            divisionMap.get(Number(row.division_id)) || row.raw_division || '',
            DAYS_TRANSLATION[row.day_of_week] || row.raw_day || '',
            periodMap.get(Number(row.period_id)) || row.raw_period || '',
            subjectMap.get(Number(row.subject_id)) || row.raw_subject || '',
            teacherMap.get(Number(row.teacher_id)) || row.raw_teacher || '',
            (row.errors || []).join(' | '),
            (row.warnings || []).join(' | '),
        ]);
        r.eachCell((cell) => {
            cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
            cell.font = { name: 'Segoe UI', size: 10 };
        });
    });

    await triggerWorkbookDownload(workbook, `تقرير_أخطاء_استيراد_الجدول_${dayjs().format('YYYY-MM-DD')}.xlsx`);
};
