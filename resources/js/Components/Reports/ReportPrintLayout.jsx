import React from 'react';
import { Printer, FileDown, Calendar, Loader2 } from 'lucide-react';

const formatDateStr = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // DD/MM/YYYY
    }
    return dateString;
};

export default function ReportPrintLayout({
    children,
    printSettings,
    setPrintSettings,
    onPrint,
    onDownloadPdf,
    isGeneratingPdf,
    startDate,
    endDate,
    documentNumberPrefix = 'HR',
    schoolInfo = {
        republic: 'الجمهورية اليمنية',
        ministry: 'وزارة التربية والتعليم والبحث العلمي',
        schoolName: 'مدارس القيم الأهلية',
        branch: 'المركز الرئيسي',
        department: 'قسم شؤون المعلمين',
        logo: '/Smart-School/public/images/logo.png',
        fallbackLogo: '/Smart-School/public/images/school_logo.png'
    }
}) {
    const getPaperDimensions = () => {
        if (printSettings.orientation === 'landscape') {
            return printSettings.paperSize === 'A4' ? { maxWidth: '297mm', minHeight: '210mm' } : { maxWidth: '420mm', minHeight: '297mm' };
        }
        return printSettings.paperSize === 'A4' ? { maxWidth: '210mm', minHeight: '297mm' } : { maxWidth: '297mm', minHeight: '420mm' };
    };
    
    const paperDims = getPaperDimensions();
    
    // Generate a consistent random document number for the session if not provided
    const docNumber = React.useMemo(() => {
        return `${documentNumberPrefix}-${new Date().getFullYear().toString().substr(-2)}0${Math.floor(Math.random() * 900) + 100}`;
    }, [documentNumberPrefix]);

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
            {/* Sidebar Print Settings */}
            <div className="w-full lg:w-[340px] shrink-0 print:hidden lg:sticky lg:top-6 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                    <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="p-6">
                        <h3 className="text-[17px] font-black text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
                            <div className="p-2 bg-primary-50 text-primary-600 rounded-lg">
                                <Printer size={20} strokeWidth={2.5} />
                            </div>
                            إعدادات وتخصيص الطباعة
                        </h3>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">عنوان التقرير</label>
                                <input 
                                    type="text" 
                                    className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-semibold transition-all h-[42px] px-3 shadow-sm"
                                    value={printSettings.title}
                                    onChange={(e) => setPrintSettings({...printSettings, title: e.target.value})}
                                />
                            </div>
                            
                            <div>
                                <label className="block text-[13px] font-bold text-slate-700 mb-1.5">اللون الأساسي للتقرير</label>
                                <div className="flex items-center gap-3 bg-slate-50/50 border border-slate-200 rounded-xl p-1.5 shadow-sm focus-within:ring-2 focus-within:ring-primary-500/20 focus-within:border-primary-500 transition-all">
                                    <input
                                        type="color"
                                        value={printSettings.brandColor}
                                        onChange={(e) => setPrintSettings({ ...printSettings, brandColor: e.target.value })}
                                        className="w-9 h-9 rounded-lg cursor-pointer border-0 p-0 bg-transparent shadow-sm"
                                    />
                                    <span className="text-sm text-slate-700 font-bold font-mono tracking-wider" dir="ltr">{printSettings.brandColor.toUpperCase()}</span>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">مقاس الورقة</label>
                                    <select 
                                        className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                        value={printSettings.paperSize}
                                        onChange={(e) => setPrintSettings({...printSettings, paperSize: e.target.value})}
                                    >
                                        <option value="A3">A3</option>
                                        <option value="A4">A4</option>
                                        <option value="A5">A5</option>
                                        <option value="B4">B4</option>
                                        <option value="B5">B5</option>
                                        <option value="letter">Letter</option>
                                        <option value="legal">Legal</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">العلامة المائية</label>
                                    <select 
                                        className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                        value={printSettings.watermark}
                                        onChange={(e) => setPrintSettings({...printSettings, watermark: e.target.value})}
                                    >
                                        <option value="none">بدون</option>
                                        <option value="confidential">سري</option>
                                        <option value="draft">مسودة</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">الهوامش</label>
                                    <select 
                                        className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                        value={printSettings.margins}
                                        onChange={(e) => setPrintSettings({...printSettings, margins: e.target.value})}
                                    >
                                        <option value="none">بدون هوامش</option>
                                        <option value="normal">عادي</option>
                                        <option value="1cm">ضيق (1cm)</option>
                                        <option value="2cm">عريض (2cm)</option>
                                    </select>
                                </div>
                                <div className="flex-1">
                                    <label className="block text-[13px] font-bold text-slate-700 mb-1.5">صفحات / ورقة</label>
                                    <select 
                                        className="w-full border-slate-200 bg-slate-50/50 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-[13px] font-semibold h-[42px] transition-all shadow-sm px-2 cursor-pointer"
                                        value={printSettings.pagesPerSheet}
                                        onChange={(e) => setPrintSettings({...printSettings, pagesPerSheet: Number(e.target.value)})}
                                    >
                                        <option value={1}>صفحة واحدة</option>
                                        <option value={2}>صفحتين</option>
                                        <option value={4}>4 صفحات</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <label className="flex items-center justify-between">
                                    <span className="text-[13px] font-bold text-slate-700">حجم الطباعة (Scale)</span>
                                    <span className="text-[11px] font-black text-primary-700 bg-primary-100 border border-primary-200 px-2 py-0.5 rounded-md shadow-sm" dir="ltr">{Math.round(printSettings.scale * 100)}%</span>
                                </label>
                                <input 
                                    type="range" 
                                    min="0.5" 
                                    max="2" 
                                    step="0.1" 
                                    value={printSettings.scale}
                                    onChange={(e) => setPrintSettings({...printSettings, scale: parseFloat(e.target.value)})}
                                    className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary-600 hover:accent-primary-700"
                                />
                            </div>

                            <div className="pt-6 border-t border-slate-100 space-y-3.5">
                                <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">اتجاه الطباعة (عرضي)</span>
                                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.orientation === 'landscape' ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, orientation: printSettings.orientation === 'landscape' ? 'portrait' : 'landscape'})}>
                                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.orientation === 'landscape' ? 'left-1' : 'right-1'}`}></div>
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">طباعة اقتصادية</span>
                                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.ecoMode ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, ecoMode: !printSettings.ecoMode})}>
                                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.ecoMode ? 'left-1' : 'right-1'}`}></div>
                                    </div>
                                </label>
                                <label className="flex items-center justify-between cursor-pointer group p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors">
                                    <span className="text-[14px] font-bold text-slate-700 group-hover:text-primary-700 transition-colors">إظهار الإحصائيات</span>
                                    <div className={`relative w-12 h-6 rounded-full transition-colors duration-300 shadow-inner ${printSettings.showKPIs ? 'bg-primary-500' : 'bg-slate-300'}`} onClick={() => setPrintSettings({...printSettings, showKPIs: !printSettings.showKPIs})}>
                                        <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow transition-all duration-300 ${printSettings.showKPIs ? 'left-1' : 'right-1'}`}></div>
                                    </div>
                                </label>
                            </div>
                            <div className="flex flex-col gap-3 mt-6 pt-4">
                                {onPrint && (
                                    <button onClick={onPrint} className="w-full px-6 py-3.5 bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-all font-black shadow-md hover:-translate-y-0.5 flex items-center justify-center gap-2">
                                        <Printer size={18} strokeWidth={2.5} />
                                        طباعة التقرير
                                    </button>
                                )}
                                {onDownloadPdf && (
                                    <button 
                                        onClick={onDownloadPdf} 
                                        disabled={isGeneratingPdf}
                                        className={`w-full px-6 py-3.5 bg-rose-600 text-white rounded-xl transition-all font-black shadow-md flex items-center justify-center gap-2 ${isGeneratingPdf ? 'opacity-70 cursor-not-allowed' : 'hover:bg-rose-700 hover:-translate-y-0.5'}`}
                                    >
                                        {isGeneratingPdf ? (
                                            <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
                                        ) : (
                                            <FileDown size={18} strokeWidth={2.5} />
                                        )}
                                        {isGeneratingPdf ? 'جاري التحضير...' : 'تنزيل كملف (PDF)'}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Paper Container */}
            <div className="flex-1 w-full overflow-x-auto print:overflow-visible flex justify-center">
                <div 
                    data-eco={printSettings.ecoMode}
                    style={{ 
                        maxWidth: paperDims.maxWidth, 
                        minHeight: paperDims.minHeight,
                        transform: `scale(${printSettings.scale})`,
                        transformOrigin: 'top center'
                    }}
                    className={`relative bg-white p-8 pt-6 border border-slate-200 w-full flex flex-col paper-container ${isGeneratingPdf ? 'shadow-none' : 'shadow-2xl'}`}
                >
                    {/* Watermark Overlay */}
                    {printSettings.watermark !== 'none' && (
                        <div className="absolute inset-0 z-0 flex items-center justify-center opacity-5 pointer-events-none print:opacity-[0.03]">
                            <img src={schoolInfo.logo} className="w-[400px] h-[400px] object-contain grayscale" alt="watermark" onError={(e) => { e.target.onerror = null; e.target.src = schoolInfo.fallbackLogo }} />
                        </div>
                    )}

                    <div className="relative mb-5 pb-4 border-b-2" style={{ borderColor: printSettings.brandColor }}>
                        {/* Elegant Top Accent */}
                        <div className="absolute -top-6 inset-x-0 h-1.5 print:opacity-100 opacity-100" style={{ backgroundColor: printSettings.brandColor }}></div>
                        {!isGeneratingPdf && (
                            <div className="absolute top-0 right-0 w-24 h-24 opacity-5 pointer-events-none" style={{ background: `linear-gradient(to bottom left, ${printSettings.brandColor}, transparent)` }}></div>
                        )}
                        
                        <div className="flex justify-between items-start pt-4">
                            {/* Right side: School info & Title */}
                            <div className="flex flex-col gap-0.5 z-10 w-[38%] pt-0.5">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: printSettings.brandColor }}></div>
                                    <h3 className="text-[11px] font-black text-slate-600 tracking-wide">{schoolInfo.republic}</h3>
                                </div>
                                <h3 className="text-[11px] font-bold text-slate-600 pr-3.5">{schoolInfo.ministry}</h3>
                                <h2 className="text-lg font-black text-slate-900 mt-1.5 pr-3.5 leading-tight tracking-tight">{schoolInfo.schoolName}</h2>
                                <h3 className="text-[11px] font-semibold text-slate-500 pr-3.5 flex items-center gap-1.5 mt-0.5">{schoolInfo.branch} <span className="w-1 h-1 rounded-full bg-slate-300"></span> {schoolInfo.department}</h3>
                                
                                <div className="mt-3 pr-3 border-r-[3px] py-0.5" style={{ borderColor: printSettings.brandColor }}>
                                    <h1 className="text-xl font-black text-slate-900 tracking-tight whitespace-nowrap leading-none">
                                        {printSettings.title}
                                    </h1>
                                </div>
                            </div>

                            {/* Center: Logo */}
                            <div className="flex flex-col items-center justify-start w-[24%] z-10">
                                <div className="w-20 h-20 bg-white flex items-center justify-center p-1 relative group">
                                    <img src={schoolInfo.logo} alt="شعار المدرسة" className="w-full h-full object-contain filter drop-shadow-sm" onError={(e) => { e.target.onerror = null; e.target.src = schoolInfo.fallbackLogo }} />
                                </div>
                            </div>

                            {/* Left side: Meta details & Period */}
                            <div className="flex flex-col items-end w-[38%] z-10">
                                <div className="w-full max-w-[230px] bg-slate-50/50 print:bg-transparent border border-slate-200 print:border-slate-300 rounded-lg overflow-hidden shadow-sm print:shadow-none">
                                    <div className="h-1 w-full" style={{ backgroundColor: printSettings.brandColor }}></div>
                                    
                                    <div className="p-3 flex flex-col gap-2.5">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">رقم الوثيقة</span>
                                            <span className="font-black text-slate-800 text-[11px]" dir="ltr">{docNumber}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">تاريخ الطباعة</span>
                                            <span className="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">{formatDateStr(new Date().toISOString().split('T')[0])}</span>
                                        </div>
                                        
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">العام الدراسي</span>
                                            <span className="font-bold text-slate-800 text-[11px] font-mono tracking-wide" dir="ltr">2026-2027</span>
                                        </div>

                                        <div className="h-px w-full bg-slate-200 print:bg-slate-300 my-0.5"></div>
                                        
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-1.5 text-slate-500">
                                                <Calendar size={12} className="text-slate-400" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">الفترة</span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{startDate ? formatDateStr(startDate) : 'بداية'}</span>
                                                <span className="font-bold text-[10px] text-slate-800 font-mono tracking-wider" dir="ltr">{endDate ? formatDateStr(endDate) : 'اليوم'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Content */}
                    <div className="flex-1 w-full flex flex-col">
                        {children}
                    </div>

                    {/* System Footer Bar */}
                    <div className="mt-auto pt-16 relative">
                        {/* Elegant separator */}
                        <div className="absolute top-0 inset-x-0 h-px bg-slate-200"></div>
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1.5 rounded-b-lg" style={{ backgroundColor: printSettings.brandColor }}></div>

                        <div className="mt-8 pt-6 border-t-2 border-slate-100 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 font-medium pb-2 gap-4">
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: printSettings.brandColor }}></span>
                                <span>أُصدر هذا التقرير آلياً من نظام <strong className="px-1" style={{ color: printSettings.brandColor }}>SMART SCHOOL ERP</strong></span>
                            </div>
                            <div className="flex items-center gap-4" dir="ltr">
                                <span>{new Date().toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx global>{`
                @media print {
                    @page {
                        size: ${paperDims.maxWidth} ${paperDims.minHeight};
                        margin: ${printSettings.margins};
                    }
                    
                    body {
                        zoom: ${printSettings.scale};
                    }

                    body * {
                        visibility: hidden;
                    }
                    
                    .paper-container, .paper-container * {
                        visibility: visible;
                    }
                    
                    .paper-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }

                    /* Eco Mode Styling */
                    [data-eco="true"] {
                        filter: grayscale(100%) contrast(1.2);
                    }
                    [data-eco="true"] * {
                        background-color: transparent !important;
                        box-shadow: none !important;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </div>
    );
}
