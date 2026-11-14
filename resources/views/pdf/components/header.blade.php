@php
    $design = $reportDesign ?? \App\Services\ReportDesignService::getDesignConfig($branchId ?? null);
    $brandColor = $brandColor ?? ($design['default_brand_color'] ?? '#059669');
    $republic = $design['republic'] ?? 'الجمهورية اليمنية';
    $ministry = $design['ministry'] ?? 'وزارة التربية والتعليم والبحث العلمي';
    $schoolName = $design['school_name'] ?? 'مدارس القيم الأهلية';
    $branchName = $design['branch_name'] ?? 'المركز الرئيسي';
    $department = $departmentName ?? ($design['department_name'] ?? 'إدارة المدرسة');
    $showHeader = $design['show_header'] ?? true;
    $showQr = $design['show_qr_code'] ?? true;
    $docNumber = $documentNumber ?? ('DOC-' . date('y') . '-' . rand(1000, 9999));
    
    // Resolve Logo
    $customLogo = $design['logo'] ?? null;
    $logoSrc = '';
    if ($customLogo && file_exists(public_path('storage/' . $customLogo))) {
        $logoSrc = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('storage/' . $customLogo)));
    } elseif (file_exists(public_path('images/logo.png'))) {
        $logoSrc = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/logo.png')));
    } elseif (file_exists(public_path('images/school_logo.png'))) {
        $logoSrc = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/school_logo.png')));
    } else {
        $logoSrc = asset('images/logo.png');
    }
@endphp

@if($showHeader)
<div class="relative mb-6 pb-4 border-b-2" style="border-color: {{ $brandColor }}">
    <!-- Top Accent Bar -->
    <div class="absolute -top-6 inset-x-0 h-1.5" style="background-color: {{ $brandColor }}"></div>
    <div class="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none" style="background: linear-gradient(to bottom left, {{ $brandColor }}, transparent)"></div>
    
    <div class="flex justify-between items-start pt-3">
        <!-- Right side: Official Country, Ministry, School & Report Title -->
        <div class="flex flex-col gap-0.5 z-10 w-[38%] pt-0.5">
            <div class="flex items-center gap-1.5 mb-1">
                <div class="w-2 h-2 rounded-full" style="background-color: {{ $brandColor }}"></div>
                <h3 class="text-[11px] font-black text-slate-700 tracking-wide">{{ $republic }}</h3>
            </div>
            <h3 class="text-[11px] font-bold text-slate-600 pr-3.5">{{ $ministry }}</h3>
            <h2 class="text-lg font-black text-slate-900 mt-1 pr-3.5 leading-tight tracking-tight">{{ $schoolName }}</h2>
            <h3 class="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">
                <span>{{ $branchName }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span>{{ $department }}</span>
            </h3>
            
            <div class="mt-2.5 pr-3 border-r-[3px] py-0.5" style="border-color: {{ $brandColor }}">
                <h1 class="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                    {{ $title ?? 'تقرير رسمي' }}
                </h1>
                @if(isset($subtitle) && $subtitle)
                    <p class="text-[11px] font-semibold text-slate-500 mt-1">{{ $subtitle }}</p>
                @endif
            </div>
        </div>

        <!-- Center: Official Logo -->
        <div class="flex flex-col items-center justify-start w-[24%] z-10">
            <div class="w-20 h-20 bg-white flex items-center justify-center p-1 relative">
                <img src="{{ $logoSrc }}" alt="شعار المدرسة" class="w-full h-full object-contain filter drop-shadow-sm" />
            </div>
        </div>

        <!-- Left side: Meta details (Document number, Date, Academic Year, Period, QR) -->
        <div class="flex flex-col items-end w-[38%] z-10">
            <div class="w-full max-w-[240px] border border-slate-300 rounded-lg overflow-hidden bg-white shadow-xs">
                <div class="h-1 w-full" style="background-color: {{ $brandColor }}"></div>
                
                <div class="p-2.5 flex flex-col gap-2">
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم الوثيقة:</span>
                        <span class="font-black text-slate-800 text-[11px]" dir="ltr">{{ $docNumber }}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة:</span>
                        <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ date('d/m/Y - H:i') }}</span>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">العام الدراسي:</span>
                        <span class="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{{ $academicYear ?? '2026-2027' }}</span>
                    </div>

                    @if(isset($startDate) || isset($endDate) || isset($date))
                    <div class="h-px w-full bg-slate-200 my-0.5"></div>
                    <div class="flex justify-between items-center">
                        <span class="text-[10px] text-slate-500 font-bold uppercase tracking-wider">الفترة:</span>
                        <div class="flex flex-col items-end">
                            @if(isset($date))
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ \Carbon\Carbon::parse($date)->format('d/m/Y') }}</span>
                            @else
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ $startDate ? \Carbon\Carbon::parse($startDate)->format('d/m/Y') : 'البداية' }}</span>
                                <span class="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{{ $endDate ? \Carbon\Carbon::parse($endDate)->format('d/m/Y') : 'اليوم' }}</span>
                            @endif
                        </div>
                    </div>
                    @endif
                </div>
            </div>
        </div>
    </div>
</div>
@else
<!-- Header Disabled for Pre-printed Letterhead Paper -->
<div class="h-28 w-full border-b border-dashed border-slate-300 mb-6 flex items-center justify-between text-slate-400 text-xs font-semibold px-4">
    <span>[مساحة مخصصة للترويسة الرسمية المطبوعة مسبقاً على الورق]</span>
    <span dir="ltr">{{ $docNumber }} | {{ date('d/m/Y') }}</span>
</div>
@endif

