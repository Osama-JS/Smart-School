<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>شهادة الدرجات الشهرية - {{ $student['name'] ?? '' }}</title>
    <style>
        @page { size: A4 portrait; margin: 9mm; }
        * { box-sizing: border-box; }
        body {
            font-family: Tahoma, Arial, sans-serif;
            margin: 0;
            padding: 0;
            color: #18181b;
            background: #ffffff;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
        }
        @php
            $customBrand = $design['default_brand_color'] ?? null;
            $useLogoPalette = empty($customBrand) || strtolower($customBrand) === '#059669';
            $primaryDark = $useLogoPalette ? '#4d7c0f' : $customBrand;
            $primaryBright = $useLogoPalette ? '#84b819' : $customBrand;
            $accentRed = '#dc2626';
            $charcoal = '#18181b';
            $tintBg = '#f7fbe9';
            $hasNotes = ($showNotes ?? true) && collect($rows)->contains(fn($r) => !empty($r['note']));

            $intToArWords = function (int $n): string {
                if ($n === 0) return 'صفر';
                if ($n >= 1000) return (string) $n;
                $ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
                $tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
                $teens = ['', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
                $hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
                $parts = [];
                $h = intdiv($n, 100);
                $rem = $n % 100;
                if ($h > 0) $parts[] = $hundreds[$h];
                if ($rem > 0) {
                    if ($rem < 10) $parts[] = $ones[$rem];
                    elseif ($rem === 10) $parts[] = $tens[1];
                    elseif ($rem < 20) $parts[] = $teens[$rem - 10];
                    else {
                        $u = $rem % 10;
                        $t = intdiv($rem, 10);
                        $parts[] = $u > 0 ? ($ones[$u] . ' و' . $tens[$t]) : $tens[$t];
                    }
                }
                return implode(' و', $parts);
            };

            $numToArWords = function ($val) use ($intToArWords): string {
                if ($val === null || $val === '') return '—';
                if (!is_numeric($val)) return (string) $val;
                $rounded = round((float) $val, 2);
                $intPart = (int) floor($rounded);
                $decPart = (int) round(($rounded - $intPart) * 100);
                $base = $intToArWords($intPart);
                if ($decPart === 0) return $base;
                if ($decPart === 50) return $intPart === 0 ? 'نصف' : $base . ' ونصف';
                if ($decPart === 25) return $intPart === 0 ? 'ربع' : $base . ' وربع';
                if ($decPart === 75) return $intPart === 0 ? 'ثلاثة أرباع' : $base . ' وثلاثة أرباع';
                return $base . ' فاصل ' . $intToArWords($decPart);
            };

            $toHijri = function (?string $dateStr): ?array {
                try {
                    $dt = $dateStr ? new \DateTime($dateStr) : new \DateTime();
                } catch (\Throwable $e) {
                    $dt = new \DateTime();
                }
                $y = (int) $dt->format('Y');
                $m = (int) $dt->format('m');
                $d = (int) $dt->format('d');
                $jd = intdiv(1461 * ($y + 4800 + intdiv($m - 14, 12)), 4)
                    + intdiv(367 * ($m - 2 - 12 * intdiv($m - 14, 12)), 12)
                    - intdiv(3 * intdiv($y + 4900 + intdiv($m - 14, 12), 100), 4)
                    + $d - 32075;
                $l = $jd - 1948440 + 10632;
                $n = intdiv($l - 1, 10631);
                $l = $l - 10631 * $n + 354;
                $j = (intdiv(10985 - $l, 5316)) * (intdiv(50 * $l, 17719))
                    + (intdiv($l, 5670)) * (intdiv(43 * $l, 15238));
                $l = $l - (intdiv(30 - $j, 15)) * (intdiv(17719 * $j, 50))
                    - (intdiv($j, 16)) * (intdiv(15238 * $j, 43)) + 29;
                $hm = intdiv(24 * $l, 709);
                $hd = $l - intdiv(709 * $hm, 24);
                $hy = 30 * $n + $j - 30;
                return [
                    'year' => (string) $hy,
                    'month' => str_pad((string) $hm, 2, '0', STR_PAD_LEFT),
                    'day' => str_pad((string) $hd, 2, '0', STR_PAD_LEFT),
                ];
            };

            $hIssue = $toHijri($issueDate ?? null);
            $hijriIssueDate = $hIssue ? ($hIssue['year'] . '/' . $hIssue['month'] . '/' . $hIssue['day'] . ' هـ') : '';

            $hijriAcademicYear = '';
            $ayStr = (string) ($academicYear ?? '');
            if (!str_contains($ayStr, 'هـ') && !preg_match('/\b14\d{2}\b/', $ayStr)) {
                if (preg_match_all('/\b(20\d{2})\b/', $ayStr, $matches) && count($matches[1]) >= 2) {
                    $hStart = $toHijri($matches[1][0] . '-09-01')['year'] ?? null;
                    $hEnd = $toHijri($matches[1][1] . '-05-01')['year'] ?? null;
                    if ($hStart && $hEnd) {
                        $hijriAcademicYear = ($hStart === $hEnd) ? ($hStart . ' هـ') : ($hStart . '/' . $hEnd . ' هـ');
                    }
                } elseif (preg_match('/\b(20\d{2})\b/', $ayStr, $mOne)) {
                    $hStart = $toHijri($mOne[1] . '-09-01')['year'] ?? null;
                    if ($hStart) $hijriAcademicYear = $hStart . ' هـ';
                } elseif ($hIssue) {
                    $hijriAcademicYear = $hIssue['year'] . ' هـ';
                }
            }
        @endphp

        .outer-frame {
            position: relative;
            border: 2px solid {{ $primaryDark }};
            border-radius: 14px;
            padding: 5px;
            background: #ffffff;
        }
        .sheet {
            position: relative;
            border: 1px solid {{ $primaryBright }}88;
            border-radius: 10px;
            padding: 16px 22px 18px;
            overflow: hidden;
            background: #ffffff;
        }
        .top-ribbon {
            position: absolute;
            top: 0;
            right: 0;
            left: 0;
            height: 6px;
            background: linear-gradient(to left, {{ $charcoal }} 0%, {{ $charcoal }} 22%, {{ $accentRed }} 22%, {{ $accentRed }} 44%, {{ $primaryBright }} 44%, {{ $primaryDark }} 100%);
        }
        .watermark {
            position: absolute;
            top: 52%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 310px;
            height: 310px;
            object-fit: contain;
            opacity: 0.045;
            pointer-events: none;
            z-index: 0;
        }
        .content {
            position: relative;
            z-index: 1;
        }

        /* Header */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid {{ $primaryBright }};
            padding-top: 4px;
            padding-bottom: 12px;
            margin-bottom: 14px;
        }
        .header-right {
            width: 36%;
            font-size: 11px;
            line-height: 1.65;
            color: #3f3f46;
        }
        .header-right .gov { font-weight: bold; color: {{ $charcoal }}; }
        .header-right h2 {
            margin: 3px 0 1px;
            font-size: 16px;
            color: {{ $primaryDark }};
            font-weight: bold;
        }
        .header-center {
            width: 26%;
            text-align: center;
        }
        .logo-ring {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 82px;
            height: 82px;
            border-radius: 50%;
            border: 2px solid {{ $primaryBright }}55;
            background: {{ $tintBg }};
            padding: 6px;
        }
        .logo-ring img {
            width: 68px;
            height: 68px;
            object-fit: contain;
        }
        .official-pill {
            display: inline-block;
            margin-top: 5px;
            padding: 2px 10px;
            border-radius: 999px;
            background: {{ $charcoal }};
            color: #ffffff;
            font-size: 9px;
            font-weight: bold;
            letter-spacing: 0.2px;
        }
        .header-left {
            width: 36%;
            font-size: 10.5px;
        }
        .meta-box {
            background: #fafafa;
            border: 1px solid #e4e4e7;
            border-right: 3px solid {{ $accentRed }};
            border-radius: 8px;
            padding: 7px 11px;
            line-height: 1.75;
        }
        .meta-row {
            display: flex;
            justify-content: space-between;
            gap: 8px;
        }
        .meta-row span { color: #52525b; }
        .meta-row strong { color: {{ $charcoal }}; }

        /* Title */
        .title-wrap {
            text-align: center;
            margin-bottom: 13px;
        }
        .title-wrap h1 {
            margin: 0 0 6px;
            font-size: 21px;
            color: {{ $charcoal }};
            font-weight: bold;
        }
        .title-divider {
            width: 90px;
            height: 3px;
            margin: 0 auto 8px;
            border-radius: 999px;
            background: linear-gradient(to left, {{ $accentRed }}, {{ $primaryBright }});
        }
        .badge {
            display: inline-block;
            padding: 4px 14px;
            border-radius: 999px;
            font-size: 10.5px;
            font-weight: bold;
        }
        .badge-brand {
            background: {{ $primaryDark }};
            color: #ffffff;
        }
        .badge-muted {
            background: {{ $tintBg }};
            color: {{ $primaryDark }};
            border: 1px solid {{ $primaryBright }}88;
            margin-left: 6px;
        }

        /* Student Info */
        .student-card {
            display: table;
            width: 100%;
            background: {{ $tintBg }};
            border: 1px solid {{ $primaryBright }}77;
            border-right: 4px solid {{ $primaryDark }};
            border-radius: 10px;
            padding: 9px 14px;
            margin-bottom: 13px;
        }
        .student-col {
            display: table-cell;
            width: 25%;
            font-size: 11px;
            vertical-align: top;
        }
        .student-col .lbl {
            color: #52525b;
            font-size: 9.5px;
            display: block;
            margin-bottom: 2px;
        }
        .student-col .val {
            font-weight: bold;
            font-size: 12.5px;
            color: {{ $charcoal }};
        }

        /* Grades Table */
        table.grades {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.5px;
            margin-bottom: 13px;
        }
        table.grades th {
            background: {{ $primaryDark }};
            color: #ffffff;
            padding: 7.5px 5px;
            border: 1px solid {{ $primaryDark }};
            text-align: center;
            font-weight: bold;
        }
        table.grades th.subj {
            text-align: right;
            padding-right: 10px;
        }
        table.grades td {
            padding: 6.5px 5px;
            border: 1px solid #d4d4d8;
            text-align: center;
            color: {{ $charcoal }};
        }
        table.grades td.subj {
            text-align: right;
            font-weight: bold;
            padding-right: 10px;
        }
        table.grades tbody tr:nth-child(even) td {
            background: #f9fbf5;
        }
        .total-col {
            font-weight: bold;
            background: {{ $tintBg }} !important;
            color: {{ $primaryDark }} !important;
        }
        .grade-pass {
            color: {{ $primaryDark }};
            font-weight: bold;
        }
        .grade-fail {
            color: {{ $accentRed }};
            font-weight: bold;
            background: #fef2f2;
        }

        /* Summary Strip */
        .summary {
            display: table;
            width: 100%;
            background: #fafafa;
            border: 1.5px solid {{ $primaryBright }}88;
            border-radius: 10px;
            padding: 10px 6px;
            margin-bottom: 14px;
        }
        .sum-cell {
            display: table-cell;
            width: 25%;
            text-align: center;
            border-left: 1px solid #e4e4e7;
            vertical-align: middle;
        }
        .sum-cell:last-child { border-left: none; }
        .sum-lbl {
            font-size: 9.5px;
            color: #52525b;
            display: block;
            margin-bottom: 3px;
        }
        .sum-val {
            font-size: 15px;
            font-weight: bold;
            color: {{ $charcoal }};
            display: block;
        }
        .sum-val.brand { color: {{ $primaryDark }}; }
        .sum-val.red { color: {{ $accentRed }}; }

        /* Notes Boxes */
        .notes-grid {
            display: flex;
            gap: 12px;
            margin-bottom: 14px;
        }
        .note-box {
            flex: 1;
            border: 1px solid #a1a1aa;
            border-radius: 10px;
            overflow: hidden;
            background: #ffffff;
        }
        .note-box-title {
            background: {{ $tintBg }};
            border-bottom: 1px solid #a1a1aa;
            text-align: center;
            font-size: 10.5px;
            font-weight: bold;
            color: {{ $charcoal }};
            padding: 5px 8px;
        }
        .note-lines {
            padding: 6px 10px 10px;
        }
        .note-line {
            border-bottom: 1px dotted #71717a;
            height: 20px;
        }

        /* Footer & Signatures */
        .footer {
            border-top: 1.5px dashed {{ $primaryBright }}aa;
            padding-top: 12px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 14px;
        }
        .verify-box {
            border: 1px solid #d4d4d8;
            border-right: 3px solid {{ $charcoal }};
            background: #fafafa;
            border-radius: 8px;
            padding: 7px 10px;
            font-size: 9px;
            line-height: 1.6;
            color: #52525b;
            min-width: 185px;
        }
        .verify-box strong { color: {{ $charcoal }}; font-size: 9.5px; }
        .sigs {
            display: flex;
            gap: 20px;
            align-items: flex-end;
        }
        .sig {
            text-align: center;
            min-width: 100px;
            font-size: 10.5px;
        }
        .sig-title {
            font-weight: bold;
            color: {{ $charcoal }};
            margin-bottom: 24px;
        }
        .sig-line {
            border-bottom: 1.5px solid #71717a;
            margin-bottom: 4px;
        }
        .sig-name { color: #52525b; font-size: 10px; }
        .stamp {
            width: 66px;
            height: 66px;
            object-fit: contain;
        }
    </style>
</head>
<body>
    <div class="outer-frame">
        <div class="sheet">
            <div class="top-ribbon"></div>
            @if(!empty($logoDataUri))
                <img src="{{ $logoDataUri }}" alt="" class="watermark">
            @endif

            <div class="content">
                <div class="header">
                    <div class="header-right">
                        <div class="gov">{{ $design['republic'] ?? 'الجمهورية اليمنية' }}</div>
                        <div>{{ $design['ministry'] ?? 'وزارة التربية والتعليم والبحث العلمي' }}</div>
                        <div>مكتب التربية والتعليم بالامانة السبعين</div>
                        <h2>{{ $design['school_name'] ?? 'مدارس القيم الأهلية' }}</h2>
                        <div style="color:#52525b">{{ $design['branch_name'] ?? '' }}</div>
                    </div>

                    <div class="header-center">
                        @if(!empty($logoDataUri))
                            <div class="logo-ring">
                                <img src="{{ $logoDataUri }}" alt="شعار المدرسة">
                            </div>
                        @endif
                        <div><span class="official-pill">وثيقة درجات رسمية</span></div>
                    </div>

                    <div class="header-left">
                        <div class="meta-box">
                            <div class="meta-row">
                                <span>العام الدراسي:</span>
                                <strong style="text-align:left">
                                    {{ $academicYear }}
                                    @if($hijriAcademicYear)<br><span style="font-size:9px;color:#52525b">{{ $hijriAcademicYear }}</span>@endif
                                </strong>
                            </div>
                            <div class="meta-row"><span>الفصل الدراسي:</span><strong>{{ $semester['name'] ?? '' }}</strong></div>
                            <div class="meta-row">
                                <span>تاريخ الإصدار:</span>
                                <strong style="text-align:left">
                                    <span dir="ltr">{{ $issueDate }}</span>
                                    @if($hijriIssueDate)<br><span style="font-size:9px;color:#52525b">{{ $hijriIssueDate }}</span>@endif
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="title-wrap">
                    <h1>شهادة الدرجات الشهرية</h1>
                    <div class="title-divider"></div>
                    <span class="badge badge-muted">{{ $semester['name'] ?? '' }}</span>
                    <span class="badge badge-brand">{{ $period['month_name'] ?? '' }}</span>
                </div>

                <div class="student-card">
                    <div class="student-col"><span class="lbl">اسم الطالب</span><span class="val">{{ $student['name'] ?? '' }}</span></div>
                    <div class="student-col"><span class="lbl">الرقم الأكاديمي</span><span class="val">{{ $student['username'] ?: ($student['id'] ?? '') }}</span></div>
                    <div class="student-col"><span class="lbl">الصف الدراسي</span><span class="val">{{ $enrollment['grade_name'] ?? '' }}</span></div>
                    <div class="student-col"><span class="lbl">الشعبة</span><span class="val">{{ $enrollment['division_name'] ?? '' }}</span></div>
                </div>

                <table class="grades">
                    <thead>
                        <tr>
                            <th class="subj">المادة</th>
                            <th>الشفهي</th>
                            <th>الواجبات</th>
                            <th>المواظبة</th>
                            <th>الاختبار</th>
                            <th>المجموع</th>
                            <th>المجموع كتابة</th>
                            @if($hasNotes)
                                <th>ملاحظة المعلم</th>
                            @endif
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($rows as $idx => $row)
                            <tr>
                                <td class="subj">{{ $row['subject_name'] }}</td>
                                <td>{{ $row['oral_total'] }} / {{ $row['oral_max'] }}</td>
                                <td>{{ $row['homework_total'] }} / {{ $row['homework_max'] }}</td>
                                <td>{{ $row['behavior'] }} / {{ $row['behavior_max'] }}</td>
                                <td>{{ $row['monthly_exam'] }} / {{ $row['exam_max'] }}</td>
                                <td class="total-col">{{ $row['grand_total'] }}</td>
                                <td style="font-weight:bold">{{ $numToArWords($row['grand_total']) }}</td>
                                @if($hasNotes)
                                    <td>{{ $row['note'] ?? '—' }}</td>
                                @endif
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <div class="summary">
                    <div class="sum-cell">
                        <span class="sum-lbl">المجموع الكلي</span>
                        <span class="sum-val">{{ $summary['total_marks'] }} / {{ $summary['max_possible'] }}</span>
                    </div>
                    <div class="sum-cell">
                        <span class="sum-lbl">النسبة المئوية</span>
                        <span class="sum-val brand">{{ $summary['percentage'] }}%</span>
                    </div>
                    <div class="sum-cell">
                        <span class="sum-lbl">التقدير العام</span>
                        <span class="sum-val {{ $summary['passed'] ? 'brand' : 'red' }}">{{ $summary['grade_text'] }}</span>
                    </div>
                    <div class="sum-cell">
                        @if(($showRank ?? true) && !empty($summary['rank']))
                            <span class="sum-lbl">الترتيب على الشعبة</span>
                            <span class="sum-val">#{{ $summary['rank'] }} من {{ $summary['division_students_count'] }}</span>
                        @else
                            <span class="sum-lbl">النتيجة النهائية</span>
                            <span class="sum-val {{ $summary['passed'] ? 'brand' : 'red' }}">{{ $summary['passed'] ? 'ناجح' : 'راسب' }}</span>
                        @endif
                    </div>
                </div>

                <div class="notes-grid">
                    <div class="note-box">
                        <div class="note-box-title">ملاحظات رائد الصف</div>
                        <div class="note-lines">
                            <div class="note-line"></div>
                            <div class="note-line"></div>
                        </div>
                    </div>
                    <div class="note-box">
                        <div class="note-box-title">ملاحظات ولي الأمر</div>
                        <div class="note-lines">
                            <div class="note-line"></div>
                            <div class="note-line"></div>
                        </div>
                    </div>
                </div>

                <div class="footer">
                    <div class="verify-box">
                        <strong>توثيق إلكتروني للوثيقة</strong><br>
                        رقم المرجع: #M-{{ $enrollment['id'] ?? '' }}-{{ $period['id'] ?? '' }}<br>
                        {{ $design['school_name'] ?? '' }}
                    </div>

                    @if(($design['show_signatures'] ?? true))
                        <div class="sigs">
                            @if($design['sig1_active'] ?? true)
                                <div class="sig">
                                    <div class="sig-title">رائد الصف</div>
                                    <div class="sig-line"></div>
                                    <div class="sig-name">{{ $design['sig1_name'] ?: 'التوقيع' }}</div>
                                </div>
                            @endif
                            @if($design['sig2_active'] ?? true)
                                <div class="sig">
                                    <div class="sig-title">المشرف</div>
                                    <div class="sig-line"></div>
                                    <div class="sig-name">{{ $design['sig2_name'] ?: 'التوقيع' }}</div>
                                </div>
                            @endif
                            @if($design['sig3_active'] ?? true)
                                <div class="sig">
                                    <div class="sig-title">مدير المدرسة</div>
                                    <div class="sig-line"></div>
                                    <div class="sig-name">{{ $design['sig3_name'] ?: 'التوقيع' }}</div>
                                </div>
                            @endif
                            @if(!empty($stampDataUri))
                                <img src="{{ $stampDataUri }}" alt="الختم" class="stamp">
                            @endif
                        </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</body>
</html>
