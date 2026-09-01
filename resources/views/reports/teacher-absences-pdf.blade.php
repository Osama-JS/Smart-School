<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'xbriyaz', 'dejavusans', sans-serif;
            font-size: 12px;
            color: #333;
            direction: rtl;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #63a22f;
            padding-bottom: 10px;
        }
        .header h1 {
            color: #63a22f;
            margin: 0;
            font-size: 20px;
        }
        .header p {
            margin: 5px 0 0;
            color: #555;
        }
        .summary-boxes {
            width: 100%;
            margin-bottom: 20px;
            border-collapse: collapse;
        }
        .summary-boxes td {
            text-align: center;
            padding: 10px;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            font-weight: bold;
            font-size: 14px;
        }
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        .table th, .table td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: right;
        }
        .table th {
            background-color: #63a22f;
            color: white;
            font-weight: bold;
        }
        .teacher-row {
            background-color: #eee;
            font-weight: bold;
        }
        .teacher-warning {
            background-color: #ffeaea;
            color: #a00;
        }
        .record-row td {
            background-color: #fff;
        }
        .badge {
            padding: 3px 6px;
            border-radius: 4px;
            font-size: 11px;
            color: #fff;
        }
        .bg-red { background-color: #e53e3e; }
        .bg-orange { background-color: #dd6b20; }
        .bg-blue { background-color: #3182ce; }
        .bg-teal { background-color: #319795; }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 10px;
            color: #777;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>

    <div class="header">
        <h1>{{ $title }}</h1>
        <p>الفترة: {{ $startDate ?: 'غير محدد' }} إلى {{ $endDate ?: 'غير محدد' }}</p>
    </div>

    @if($showKPIs)
    <table class="summary-boxes">
        <tr>
            <td>إجمالي الغياب: <br><span style="color: #e53e3e; font-size: 18px;">{{ $totalAbsences }}</span></td>
            <td>إجمالي التأخير: <br><span style="color: #dd6b20; font-size: 18px;">{{ $totalLates }}</span></td>
            <td>المعلمين المخالفين: <br><span style="color: #3182ce; font-size: 18px;">{{ $uniqueTeachers }}</span></td>
        </tr>
    </table>
    @endif

    <table class="table">
        <thead>
            <tr>
                <th width="10%">م</th>
                <th width="20%">اليوم</th>
                <th width="30%">التاريخ</th>
                <th width="40%">الحالة</th>
            </tr>
        </thead>
        <tbody>
            @forelse($groupedAbsences as $teacherName => $data)
                @php
                    $isWarning = $data['absent_count'] >= 3 || $data['late_count'] >= 3;
                @endphp
                <tr class="teacher-row {{ $isWarning ? 'teacher-warning' : '' }}">
                    <td colspan="4">
                        <span style="font-size: 14px;">{{ $teacherName }}</span>
                        <span style="font-size: 11px; color: #666;">(قسم: {{ $data['department'] }})</span>
                        <div style="float: left; font-size: 11px;">
                            غياب: {{ $data['absent_count'] }} | تأخير: {{ $data['late_count'] }} 
                            @if($data['total_late_minutes'] > 0)
                                ({{ $data['total_late_minutes'] }} د)
                            @endif
                        </div>
                    </td>
                </tr>
                @foreach($data['records'] as $index => $record)
                    <tr class="record-row">
                        <td style="text-align: center;">{{ $index + 1 }}</td>
                        <td>{{ $record['day'] }}</td>
                        <td>{{ $record['date'] }}</td>
                        <td>
                            @php
                                $badgeClass = '';
                                if ($record['status_code'] === 'absent') $badgeClass = 'bg-red';
                                elseif ($record['status_code'] === 'late') $badgeClass = 'bg-orange';
                                elseif ($record['status_code'] === 'excused') $badgeClass = 'bg-blue';
                                elseif ($record['status_code'] === 'leave') $badgeClass = 'bg-teal';
                            @endphp
                            <span class="badge {{ $badgeClass }}">{{ $record['status'] }}</span>
                            @if($record['status_code'] === 'late' && $record['late_minutes'])
                                <small>({{ $record['late_minutes'] }} دقيقة)</small>
                            @endif
                        </td>
                    </tr>
                @endforeach
            @empty
                <tr>
                    <td colspan="4" style="text-align: center; padding: 20px;">لا توجد سجلات غياب تطابق الفلاتر المحددة.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">
        أُصدر هذا التقرير آلياً من نظام SMART SCHOOL ERP - تاريخ الإصدار: {{ now()->format('Y-m-d H:i') }}
    </div>

</body>
</html>
