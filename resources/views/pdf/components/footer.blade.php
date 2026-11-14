@php
    $design = $reportDesign ?? \App\Services\ReportDesignService::getDesignConfig($branchId ?? null);
    $brandColor = $brandColor ?? ($design['default_brand_color'] ?? '#059669');
    $showFooter = $design['show_footer'] ?? true;
    $showSignatures = $design['show_signatures'] ?? true;
    $showStamp = $design['show_stamp'] ?? true;
    $showPageNumber = $design['show_page_number'] ?? true;
    $footerNotice = $design['footer_notice'] ?? 'وثيقة رسمية صادرة آلياً من نظام مدارك الذكي - مدارس القيم الأهلية';
    
    // Resolve Stamp Image
    $customStamp = $design['stamp_image'] ?? null;
    $stampSrc = '';
    if ($customStamp && file_exists(public_path('storage/' . $customStamp))) {
        $stampSrc = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('storage/' . $customStamp)));
    } elseif (file_exists(public_path('images/school_stamp.png'))) {
        $stampSrc = 'data:image/png;base64,' . base64_encode(file_get_contents(public_path('images/school_stamp.png')));
    }
@endphp

@if($showFooter)
<div class="mt-8 pt-4 page-break-inside-avoid">
    
    <!-- Signatures & Official Stamp Grid -->
    @if($showSignatures)
    <div class="grid grid-cols-3 gap-6 mb-8 text-center text-xs">
        
        <!-- Signature 1: Preparation / Specialist -->
        @if($design['sig1_active'] ?? true)
        <div class="flex flex-col items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50/50 min-h-[95px]">
            <span class="font-bold text-slate-700 pb-1 border-b border-slate-200 w-full">{{ $design['sig1_title'] ?? 'إعداد / المختص' }}</span>
            <div class="h-10 flex items-center justify-center font-semibold text-slate-500 italic text-[11px]">
                {{ $design['sig1_name'] ?: 'التوقيع: .....................' }}
            </div>
        </div>
        @else
        <div></div>
        @endif

        <!-- Signature 2: Review / Supervisor -->
        @if($design['sig2_active'] ?? true)
        <div class="flex flex-col items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50/50 min-h-[95px]">
            <span class="font-bold text-slate-700 pb-1 border-b border-slate-200 w-full">{{ $design['sig2_title'] ?? 'مراجعة / وكيل المدرسة' }}</span>
            <div class="h-10 flex items-center justify-center font-semibold text-slate-500 italic text-[11px]">
                {{ $design['sig2_name'] ?: 'التوقيع: .....................' }}
            </div>
        </div>
        @else
        <div></div>
        @endif

        <!-- Signature 3 & Official Stamp: Principal Approval -->
        @if($design['sig3_active'] ?? true)
        <div class="flex flex-col items-center justify-between border border-slate-200 rounded-xl p-3 bg-slate-50/50 min-h-[95px] relative overflow-hidden">
            <span class="font-bold text-slate-700 pb-1 border-b border-slate-200 w-full">{{ $design['sig3_title'] ?? 'اعتماد / مدير الفرع' }}</span>
            
            <div class="h-10 w-full flex items-center justify-center relative">
                @if($showStamp && $stampSrc)
                    <img src="{{ $stampSrc }}" alt="ختم المدرسة" class="h-14 w-14 object-contain opacity-80 absolute -top-2 left-1/2 -translate-x-1/2 pointer-events-none transform -rotate-6" />
                @else
                    <span class="font-semibold text-slate-500 italic text-[11px]">{{ $design['sig3_name'] ?: 'الختم والتوقيع: .....................' }}</span>
                @endif
            </div>
        </div>
        @else
        <div></div>
        @endif

    </div>
    @endif

    <!-- System Audit Line & Bottom Brand Bar -->
    <div class="relative pt-3 border-t border-slate-200 flex justify-between items-center text-[10px] text-slate-500 font-semibold">
        <!-- Accent indicator -->
        <div class="absolute top-0 right-1/2 translate-x-1/2 w-28 h-1 rounded-b-md" style="background-color: {{ $brandColor }}"></div>

        <div class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full" style="background-color: {{ $brandColor }}"></span>
            <span>{{ $footerNotice }}</span>
        </div>

        <div class="flex items-center gap-4" dir="ltr">
            @if($showPageNumber)
                <span class="font-mono text-slate-400">Page 1 of 1</span>
            @endif
            <span class="font-mono text-slate-400">{{ date('Y-m-d H:i:s') }}</span>
        </div>
    </div>
</div>
@endif

