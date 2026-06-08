<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>دعوة اجتماع</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #334155; }
        .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); }
        .header { background-color: #3b82f6; color: #ffffff; padding: 30px 20px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px 20px; }
        .details { background-color: #f1f5f9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .details p { margin: 10px 0; font-size: 16px; }
        .details strong { color: #1e293b; }
        .agendas { margin-top: 20px; }
        .agendas ul { padding-right: 20px; }
        .agendas li { margin-bottom: 8px; }
        .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 14px; color: #64748b; border-top: 1px solid #e2e8f0; }
        .btn { display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>دعوة لحضور اجتماع</h1>
        </div>
        <div class="content">
            <p>مرحباً،</p>
            <p>لقد تمت دعوتك لحضور اجتماع جديد. إليك تفاصيل الاجتماع:</p>
            
            <div class="details">
                <p><strong>📌 العنوان:</strong> {{ $meeting->title }}</p>
                <p><strong>📅 التاريخ:</strong> {{ \Carbon\Carbon::parse($meeting->date)->translatedFormat('l، j F Y') }}</p>
                <p><strong>⏰ الوقت:</strong> {{ \Carbon\Carbon::parse($meeting->time)->format('h:i A') }}</p>
                <p><strong>🏢 النوع:</strong> {{ $meeting->type == 'in_person' ? 'حضوري' : 'عن بعد (Online)' }}</p>
                <p><strong>👤 المشرف:</strong> {{ $meeting->supervisor->name ?? 'غير محدد' }}</p>
            </div>

            @if(!empty($meeting->agendas))
            <div class="agendas">
                <h3>محاور الاجتماع:</h3>
                <ul>
                    @foreach($meeting->agendas as $agenda)
                        <li>{{ $agenda }}</li>
                    @endforeach
                </ul>
            </div>
            @endif

            <div style="text-align: center;">
                <a href="{{ config('app.url') }}/meetings/{{ $meeting->id }}" class="btn">عرض تفاصيل الاجتماع</a>
            </div>
        </div>
        <div class="footer">
            <p>هذه رسالة تلقائية من نظام إدارة المدرسة الذكية.</p>
        </div>
    </div>
</body>
</html>
