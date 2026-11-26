import React from 'react';

export const DISCIPLINARY_COUNCIL_SIGNATURES = [
    { title: 'الأخصائي', name: 'أ/ أحمد الأسدي' },
    { title: 'التوجيه', name: 'أ/ عبدالقادر مرعي' },
    { title: 'وكيل المدرسة', name: 'أ/ أشواق السعيدي' },
    { title: 'وكيل المدرسة', name: 'أ/ علي الساري' },
    { title: 'المدير التنفيذي', name: 'أ/ علي عبدالغني' },
    { title: 'المدير العام', name: 'أ/ أروى عباد' },
];

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const toArabicDigits = (num) => {
    return String(num)
        .split('')
        .map((ch) => (ch >= '0' && ch <= '9' ? ARABIC_INDIC_DIGITS[Number(ch)] : ch))
        .join('');
};

const htmlToLines = (raw) => {
    if (raw === null || raw === undefined) return [];
    const str = String(raw);
    const withNewlines = str
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/(p|div|li|tr|h[1-6]|blockquote)>/gi, '\n')
        .replace(/<li[^>]*>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&amp;/gi, '&')
        .replace(/&lt;/gi, '<')
        .replace(/&gt;/gi, '>')
        .replace(/&quot;/gi, '"')
        .replace(/&#0*39;/gi, "'");

    return withNewlines
        .split(/\r?\n/)
        .map((line) => line.replace(/\s+/g, ' ').trim())
        .filter(Boolean);
};

export function isDisciplinaryCouncilTemplate(template) {
    const name = String(template?.name || '').trim();
    if (!name) return false;
    return (
        name.includes('تقرير مجلس انضباطي') ||
        name.includes('تقرير المجلس التأديبي') ||
        name.includes('المجلس الانضباطي') ||
        name.includes('المجلس التأديبي')
    );
}

const findFieldValue = (data, fields, matchers, fallbackKeys = []) => {
    const safeData = data && typeof data === 'object' ? data : {};
    const safeFields = Array.isArray(fields) ? fields : [];

    for (const matcher of matchers) {
        const matchedField = safeFields.find((f) => String(f?.name || '').includes(matcher));
        if (matchedField) {
            const candidates = [
                safeData[matchedField.name],
                safeData[String(matchedField.id)],
                safeData[matchedField.id],
                safeData[`field_${matchedField.id}`],
            ];
            for (const val of candidates) {
                if (val !== undefined && val !== null && val !== '') {
                    return val;
                }
            }
        }
    }

    for (const key of fallbackKeys) {
        if (safeData[key] !== undefined && safeData[key] !== null && safeData[key] !== '') {
            return safeData[key];
        }
    }

    for (const key of Object.keys(safeData)) {
        if (matchers.some((m) => String(key).includes(m))) {
            const val = safeData[key];
            if (val !== undefined && val !== null && val !== '') {
                return val;
            }
        }
    }

    return '';
};

export function getDisciplinaryCouncilMockData(fields = []) {
    const defaults = {
        'رقم التقرير': '14',
        'اليوم': 'الأحد',
        'التاريخ (الموافق)': '2026-11-26',
        'موضوع انعقاد المجلس': 'مناقشة الحالة السلوكية والانضباطية للطالب واتخاذ الإجراءات التربوية اللازمة وفق لائحة الانضباط المدرسي.',
        'القرارات (ما تم إقراره بعد المناقشة)':
            'تنبيه الطالب كتابياً وأخذ تعهد خطي بعدم تكرار المخالفة.\nاستدعاء ولي أمر الطالب لإطلاعه على قرار المجلس والتوقيع على المحضر.\nمتابعة سلوك الطالب وانضباطه لمدة أسبوعين من قِبل الأخصائي الاجتماعي.',
    };

    const result = { ...defaults };

    if (Array.isArray(fields)) {
        fields.forEach((field) => {
            const fname = String(field?.name || '');
            if (!fname) return;
            if (fname.includes('رقم')) {
                result[fname] = defaults['رقم التقرير'];
            } else if (fname.includes('اليوم')) {
                result[fname] = defaults['اليوم'];
            } else if (fname.includes('التاريخ') || fname.includes('الموافق')) {
                result[fname] = defaults['التاريخ (الموافق)'];
            } else if (fname.includes('موضوع')) {
                result[fname] = defaults['موضوع انعقاد المجلس'];
            } else if (fname.includes('القرارات') || fname.includes('إقرار')) {
                result[fname] = defaults['القرارات (ما تم إقراره بعد المناقشة)'];
            }
        });
    }

    return result;
}

export function extractDisciplinaryCouncilValues(data = {}, fields = []) {
    const rawNumber = findFieldValue(data, fields, ['رقم'], ['رقم التقرير']);
    const rawDay = findFieldValue(data, fields, ['اليوم'], ['اليوم']);
    const rawDate = findFieldValue(data, fields, ['التاريخ', 'الموافق'], ['التاريخ (الموافق)']);
    const rawSubject = findFieldValue(data, fields, ['موضوع'], ['موضوع انعقاد المجلس']);
    const rawDecisions = findFieldValue(
        data,
        fields,
        ['القرارات', 'إقرار'],
        ['القرارات (ما تم إقراره بعد المناقشة)']
    );

    const reportNumber = htmlToLines(rawNumber).join(' ').trim();
    const day = htmlToLines(rawDay).join(' ').trim();
    const date = htmlToLines(rawDate).join(' ').trim();
    const subjectLines = htmlToLines(rawSubject);
    const subject = subjectLines.join('\n').trim();

    const parsedDecisions = htmlToLines(rawDecisions)
        .map((line) => line.replace(/^(?:[0-9٠-٩]+\s*[-–.)ـ:\]]\s*|[•●▪*✓\-–]\s*)+/, '').trim())
        .filter(Boolean);

    const decisionsList = [...parsedDecisions];
    while (decisionsList.length < 3) {
        decisionsList.push('');
    }

    return {
        reportNumber,
        day,
        date,
        subject,
        decisionsList,
    };
}

export function DisciplinaryCouncilReportSheet({ template, data, report = null, isPrint = false }) {
    const fields = template?.fields || [];
    const { reportNumber, day, date, subject, decisionsList } = extractDisciplinaryCouncilValues(
        data || {},
        fields
    );

    const subjectRawLines = subject ? subject.split('\n') : [];
    const estimatedSubjectRows = subjectRawLines.reduce(
        (acc, line) => acc + Math.max(1, Math.ceil(line.length / 72)),
        0
    );
    const subjectDottedRowsCount = Math.max(3, estimatedSubjectRows);

    return (
        <div
            style={{
                direction: 'rtl',
                fontFamily: 'Tajawal, "Segoe UI", Arial, sans-serif',
                backgroundColor: '#ffffff',
                color: '#111827',
                width: isPrint ? '100%' : '100%',
                maxWidth: isPrint ? 'none' : '820px',
                margin: '0 auto',
                padding: isPrint ? '8mm' : '16px',
                boxSizing: 'border-box',
            }}
        >
            {/* Outer Framed Official Paper */}
            <div
                style={{
                    position: 'relative',
                    border: '2px solid #1e293b',
                    borderRadius: '10px',
                    padding: isPrint ? '16px 22px 18px 22px' : '22px 26px 20px 26px',
                    minHeight: isPrint ? '275mm' : '920px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    backgroundColor: '#ffffff',
                    boxShadow: isPrint ? 'none' : '0 10px 30px rgba(15, 23, 42, 0.08)',
                    boxSizing: 'border-box',
                    overflow: 'hidden',
                }}
            >
                {/* Faint Center Watermark */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        opacity: 0.045,
                        pointerEvents: 'none',
                        zIndex: 0,
                    }}
                >
                    <img
                        src="/images/school_logo.png"
                        alt=""
                        loading="eager"
                        style={{ width: '340px', height: 'auto', objectFit: 'contain' }}
                    />
                </div>

                {/* Main Content Wrapper */}
                <div style={{ position: 'relative', zIndex: 1 }}>
                    {/* ══════════ OFFICIAL 3-COLUMN HEADER ══════════ */}
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1.25fr 1fr',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '6px',
                        }}
                    >
                        {/* Right: Official Hierarchy */}
                        <div
                            style={{
                                textAlign: 'center',
                                lineHeight: 1.55,
                                color: '#1f2937',
                            }}
                        >
                            <div style={{ fontSize: '15px', fontWeight: 900 }}>الجمهورية اليمنية</div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
                                وزارة التربية والتعليم والبحث العلمي
                            </div>
                            <div style={{ fontSize: '11.5px', fontWeight: 700 }}>
                                المنطقة التعليمية بمديرية السبعين
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 800 }}>مدارس القيم الأهلية</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: '#4b5563' }}>
                                المركز الرئيسي
                            </div>
                        </div>

                        {/* Center: Emblem Seal */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <svg
                                width="74"
                                height="56"
                                viewBox="0 0 120 90"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                aria-hidden="true"
                            >
                                <path
                                    d="M60 12C50 12 43 18 40 25C30 22 18 23 10 29C15 39 24 45 36 46C31 54 31 64 38 72L60 63L82 72C89 64 89 54 84 46C96 45 105 39 110 29C102 23 90 22 80 25C77 18 70 12 60 12Z"
                                    fill="#B58E2B"
                                    fillOpacity="0.18"
                                    stroke="#9A7418"
                                    strokeWidth="2.2"
                                />
                                <rect x="48" y="31" width="24" height="22" rx="4" fill="#fff" stroke="#9A7418" strokeWidth="2" />
                                <path d="M49 38H71" stroke="#CE1126" strokeWidth="4" />
                                <path d="M49 48H71" stroke="#111827" strokeWidth="4" />
                                <circle cx="60" cy="21" r="4.5" fill="#9A7418" />
                                <path d="M36 74H84" stroke="#9A7418" strokeWidth="2.2" strokeLinecap="round" />
                            </svg>
                        </div>

                        {/* Left: School Logo */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                                src="/images/school_logo.png"
                                alt="مدارس القيم الأهلية"
                                loading="eager"
                                style={{ width: '98px', height: 'auto', objectFit: 'contain' }}
                            />
                        </div>
                    </div>

                    {/* ══════════ GREEN ACCENTED TITLE BANNER ══════════ */}
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            width: '100%',
                            margin: '8px 0 22px 0',
                        }}
                    >
                        <div
                            style={{
                                width: '48px',
                                height: '14px',
                                backgroundColor: '#9BB643',
                                borderRadius: '2px',
                            }}
                        />
                        <div style={{ height: '1.5px', backgroundColor: '#9BB643', flex: 1 }} />
                        <div
                            style={{
                                padding: '5px 46px',
                                border: '1.5px solid #94a3b8',
                                borderRadius: '999px',
                                backgroundColor: '#ffffff',
                                fontSize: '20px',
                                fontWeight: 900,
                                color: '#111827',
                                textAlign: 'center',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            تقرير مجلس انضباطي
                        </div>
                        <div style={{ height: '1.5px', backgroundColor: '#9BB643', flex: 1 }} />
                        <div
                            style={{
                                width: '48px',
                                height: '14px',
                                backgroundColor: '#9BB643',
                                borderRadius: '2px',
                            }}
                        />
                    </div>

                    {/* ══════════ REPORT NUMBER BOX ══════════ */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '26px', paddingRight: '18px' }}>
                        <div
                            style={{
                                backgroundColor: '#e7ecc8',
                                border: '1.5px solid #a3b95c',
                                borderRadius: '6px',
                                padding: '5px 20px',
                                minWidth: '140px',
                                textAlign: 'center',
                                fontSize: '15px',
                                fontWeight: 900,
                                color: '#1f2937',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                            }}
                        >
                            <span>رقم</span>
                            <span>(</span>
                            <span style={{ minWidth: '34px', fontWeight: 900, color: '#111827' }}>
                                {reportNumber || (report?.id ? report.id : '\u00A0')}
                            </span>
                            <span>)</span>
                        </div>
                    </div>

                    {/* ══════════ OFFICIAL PREAMBLE LINE ══════════ */}
                    <div
                        style={{
                            fontSize: '16.5px',
                            fontWeight: 800,
                            lineHeight: 2.3,
                            color: '#111827',
                            marginBottom: '18px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            alignItems: 'baseline',
                            gap: '6px',
                        }}
                    >
                        <span>في يوم</span>
                        <span
                            style={{
                                display: 'inline-block',
                                minWidth: '120px',
                                borderBottom: '1.5px dotted #334155',
                                textAlign: 'center',
                                fontWeight: 900,
                                padding: '0 8px',
                                lineHeight: 1.5,
                            }}
                        >
                            {day || '\u00A0'}
                        </span>
                        <span>الموافق</span>
                        <span
                            style={{
                                display: 'inline-block',
                                minWidth: '155px',
                                borderBottom: '1.5px dotted #334155',
                                textAlign: 'center',
                                fontWeight: 900,
                                padding: '0 8px',
                                lineHeight: 1.5,
                            }}
                        >
                            {date || '\u00A0'}
                        </span>
                        <span>تم عقد المجلس الانضباطي لمناقشة</span>
                    </div>

                    {/* ══════════ SUBJECT SECTION (موضوع) ══════════ */}
                    <div style={{ marginBottom: '28px' }}>
                        <div
                            style={{
                                fontSize: '16.5px',
                                fontWeight: 900,
                                color: '#111827',
                                marginBottom: '10px',
                            }}
                        >
                            موضوع
                        </div>

                        <div style={{ position: 'relative', minHeight: `${subjectDottedRowsCount * 38}px` }}>
                            {/* Dotted horizontal writing lines */}
                            <div
                                aria-hidden="true"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    right: 0,
                                    left: 0,
                                    zIndex: 0,
                                }}
                            >
                                {Array.from({ length: subjectDottedRowsCount }).map((_, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            height: '38px',
                                            borderBottom: '1.5px dotted #334155',
                                            boxSizing: 'border-box',
                                        }}
                                    />
                                ))}
                            </div>

                            {/* Subject text layered neatly across the dotted lines */}
                            <div
                                style={{
                                    position: 'relative',
                                    zIndex: 1,
                                    minHeight: '114px',
                                    fontSize: '15.5px',
                                    fontWeight: 700,
                                    color: '#111827',
                                    lineHeight: '38px',
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    padding: '0 4px',
                                }}
                            >
                                {subject || '\u00A0'}
                            </div>
                        </div>
                    </div>

                    {/* ══════════ NUMBERED DECISIONS SECTION ══════════ */}
                    <div style={{ marginBottom: '26px', paddingRight: '10%' }}>
                        <div
                            style={{
                                fontSize: '16.5px',
                                fontWeight: 900,
                                color: '#111827',
                                marginBottom: '18px',
                            }}
                        >
                            وبعد مناقشة الموضوع تم إقرار ما يلي :
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '8px' }}>
                            {decisionsList.map((decision, idx) => (
                                <div
                                    key={idx}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        fontSize: '15.5px',
                                        fontWeight: 800,
                                        color: '#111827',
                                    }}
                                >
                                    <span
                                        style={{
                                            whiteSpace: 'nowrap',
                                            fontWeight: 900,
                                            fontSize: '16px',
                                            paddingTop: '2px',
                                            minWidth: '34px',
                                        }}
                                    >
                                        {toArabicDigits(idx + 1)} -
                                    </span>
                                    <div
                                        style={{
                                            flex: 1,
                                            minHeight: '32px',
                                            borderBottom: '1.5px dotted #475569',
                                            paddingBottom: '6px',
                                            lineHeight: 1.85,
                                            fontWeight: 700,
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {decision || '\u00A0'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ══════════ SIX OFFICIAL SIGNATURES FOOTER ══════════ */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 1,
                        marginTop: '36px',
                        paddingTop: '14px',
                        borderTop: '1.5px solid #cbd5e1',
                        pageBreakInside: 'avoid',
                    }}
                >
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, minmax(0, 1fr))',
                            gap: '8px',
                            textAlign: 'center',
                            alignItems: 'start',
                        }}
                    >
                        {DISCIPLINARY_COUNCIL_SIGNATURES.map((sig, idx) => (
                            <div
                                key={idx}
                                style={{
                                    padding: '4px 4px 28px 4px',
                                    borderLeft:
                                        idx < DISCIPLINARY_COUNCIL_SIGNATURES.length - 1
                                            ? '1px dashed #e2e8f0'
                                            : 'none',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '12.5px',
                                        fontWeight: 900,
                                        color: '#111827',
                                        marginBottom: '4px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {sig.title}
                                </div>
                                <div
                                    style={{
                                        fontSize: '12px',
                                        fontWeight: 700,
                                        color: '#334155',
                                        marginBottom: '26px',
                                        whiteSpace: 'nowrap',
                                    }}
                                >
                                    {sig.name}
                                </div>
                                <div
                                    style={{
                                        width: '82%',
                                        margin: '0 auto',
                                        borderBottom: '1px dotted #94a3b8',
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DisciplinaryCouncilReportSheet;
