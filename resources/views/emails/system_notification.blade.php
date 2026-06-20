<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title }}</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f8fafc;
            color: #1e293b;
            line-height: 1.6;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            border: 1px solid #e2e8f0;
        }
        .header {
            background-color: #0f172a;
            color: #ffffff;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 20px;
            font-weight: 600;
        }
        .content {
            padding: 32px 24px;
        }
        .greeting {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 16px;
        }
        .message {
            font-size: 16px;
            color: #475569;
            margin-bottom: 24px;
            white-space: pre-line;
        }
        .action-button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff;
            text-decoration: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
        }
        .footer {
            background-color: #f1f5f9;
            padding: 16px;
            text-align: center;
            font-size: 14px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>{{ config('app.name', 'نظام قيم') }}</h1>
        </div>
        <div class="content">
            <div class="greeting">
                مرحباً {{ $user->name }}،
            </div>
            
            <div class="message">
                <strong>{{ $title }}</strong><br><br>
                {{ $messageText }}
            </div>

            @if($actionUrl && $actionText)
            <div style="text-align: center; margin-top: 32px;">
                <a href="{{ $actionUrl }}" class="action-button">{{ $actionText }}</a>
            </div>
            @endif
        </div>
        <div class="footer">
            هذه رسالة تلقائية من نظام الإدارة، يرجى عدم الرد عليها.
        </div>
    </div>
</body>
</html>
