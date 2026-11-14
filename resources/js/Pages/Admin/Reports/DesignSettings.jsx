import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { 
    Palette, FileText, Check, Save, Image, Stamp, Shield, 
    QrCode, FileSpreadsheet, Eye, RefreshCw, AlertCircle, Sparkles,
    Building, ChevronLeft, Sliders, Monitor
} from 'lucide-react';

export default function ReportDesignSettings({ design }) {
    const { data, setData, post, processing, errors, recentlySuccessful } = useForm({
        // Header
        republic: design?.republic || 'الجمهورية اليمنية',
        ministry: design?.ministry || 'وزارة التربية والتعليم والبحث العلمي',
        school_name: design?.school_name || 'مدارس القيم الأهلية',
        branch_name: design?.branch_name || 'المركز الرئيسي',
        department_name: design?.department_name || 'الشؤون التعليمية والإدارية',
        default_brand_color: design?.default_brand_color || '#059669',
        show_header: design?.show_header ?? true,
        show_qr_code: design?.show_qr_code ?? true,
        show_barcode: design?.show_barcode ?? true,
        logo: null,

        // Footer & Signatures
        show_footer: design?.show_footer ?? true,
        show_signatures: design?.show_signatures ?? true,
        sig1_active: design?.sig1_active ?? true,
        sig1_title: design?.sig1_title || 'إعداد / المختص',
        sig1_name: design?.sig1_name || '',

        sig2_active: design?.sig2_active ?? true,
        sig2_title: design?.sig2_title || 'مراجعة / وكيل المدرسة',
        sig2_name: design?.sig2_name || '',

        sig3_active: design?.sig3_active ?? true,
        sig3_title: design?.sig3_title || 'اعتماد / مدير الفرع',
        sig3_name: design?.sig3_name || '',

        show_stamp: design?.show_stamp ?? true,
        stamp_image: null,
        show_page_number: design?.show_page_number ?? true,
        footer_notice: design?.footer_notice || 'وثيقة رسمية صادرة آلياً من نظام مدارك الذكي - مدارس القيم الأهلية',
    });

    const [logoPreview, setLogoPreview] = useState(design?.logo ? `/storage/${design.logo}` : '/images/logo.png');
    const [stampPreview, setStampPreview] = useState(design?.stamp_image ? `/storage/${design.stamp_image}` : null);
    
    // Tab state: 'settings' or 'preview'
    const [activeTab, setActiveTab] = useState('settings');

    const handleLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo', file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleStampChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('stamp_image', file);
            setStampPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('reports.design-settings.update'), {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <AdminLayout activeMenu="التقارير">
            <Head title="تخصيص هوية وتصميم تقارير الـ PDF" />

            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-primary-50/70 via-white to-white dark:from-primary-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-primary-100 dark:border-primary-500/10 rounded-3xl p-6 md:p-8 shadow-sm">
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700" />
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="p-2 bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 rounded-xl">
                                    <Palette size={22} />
                                </span>
                                <h1 className="text-2xl font-black text-slate-800 dark:text-white">التحكم في تصميم وتقارير الـ PDF</h1>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                تخصيص الترويسة العلوية، الألوان الرسمية، مربعات التواقيع والاعتمادات، والختم الإلكتروني مع ميزة المعاينة الحية المباشرة
                            </p>
                        </div>

                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {/* Tabs Switcher for small screens or toggling */}
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('settings')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                                >
                                    <Sliders size={14} />
                                    <span>لوحة التعديل</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('preview')}
                                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'preview' ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'}`}
                                >
                                    <Eye size={14} />
                                    <span>معاينة حية (Live Preview)</span>
                                </button>
                            </div>

                            <Link
                                href={route('reports.center')}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                            >
                                <ChevronLeft size={15} className="rtl:-scale-x-100" />
                                <span>المركز</span>
                            </Link>
                        </div>
                    </div>
                </div>

                {recentlySuccessful && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300 font-bold text-sm animate-in fade-in">
                        <Check size={20} className="text-emerald-500" />
                        <span>تم حفظ وتطبيق التعديلات على كافة تقارير الـ PDF بنجاح!</span>
                    </div>
                )}

                {/* Main Split Layout: Form on Right & Instant Live Preview on Left */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* Settings Form Column */}
                    <div className={`space-y-6 ${activeTab === 'preview' ? 'hidden lg:block lg:col-span-5' : 'lg:col-span-6'}`}>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            
                            {/* 1. Header & Identity Section */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-500/10 text-primary-600 flex items-center justify-center font-bold text-xs">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-800 dark:text-white">ترويسة التقرير (Header)</h2>
                                        <p className="text-[11px] text-slate-500">النصوص والشعار والألوان العلوية</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">الدولة</label>
                                        <input
                                            type="text"
                                            value={data.republic}
                                            onChange={(e) => setData('republic', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">الوزارة المشرفة</label>
                                        <input
                                            type="text"
                                            value={data.ministry}
                                            onChange={(e) => setData('ministry', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">اسم المدرسة</label>
                                            <input
                                                type="text"
                                                value={data.school_name}
                                                onChange={(e) => setData('school_name', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">الفرع</label>
                                            <input
                                                type="text"
                                                value={data.branch_name}
                                                onChange={(e) => setData('branch_name', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white"
                                                placeholder="المركز الرئيسي"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">القسم الافتراضي</label>
                                            <input
                                                type="text"
                                                value={data.department_name}
                                                onChange={(e) => setData('department_name', e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold dark:text-white"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">لون السمة (Brand Color)</label>
                                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-1">
                                                <input
                                                    type="color"
                                                    value={data.default_brand_color}
                                                    onChange={(e) => setData('default_brand_color', e.target.value)}
                                                    className="w-7 h-7 rounded-lg cursor-pointer border-0 bg-transparent p-0"
                                                />
                                                <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-200" dir="ltr">{data.default_brand_color}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Logo Upload */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">شعار المدرسة</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                                {logoPreview ? (
                                                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Image size={18} className="text-slate-400" />
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleLogoChange}
                                                className="text-xs text-slate-500 file:py-1.5 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-primary-50 file:text-primary-700 cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-2 flex flex-col gap-2">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.show_header}
                                                onChange={(e) => setData('show_header', e.target.checked)}
                                                className="w-3.5 h-3.5 text-primary-600 rounded"
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إظهار الترويسة في الطباعة (عطله للورق المروس مسبقاً)</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={data.show_qr_code}
                                                onChange={(e) => setData('show_qr_code', e.target.checked)}
                                                className="w-3.5 h-3.5 text-primary-600 rounded"
                                            />
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">إظهار صندوق رقم وتاريخ وفترة الوثيقة</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Footer & Signatures Section */}
                            <div className="bg-white dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
                                <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                        2
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black text-slate-800 dark:text-white">التذييل والتواقيع والختم (Footer)</h2>
                                        <p className="text-[11px] text-slate-500">لجان الاعتماد، ختم المدرسة، وترقيم الصفحات</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {/* Signature 1 */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">الخانة 1: المُعِد</span>
                                            <input
                                                type="checkbox"
                                                checked={data.sig1_active}
                                                onChange={(e) => setData('sig1_active', e.target.checked)}
                                                className="w-3.5 h-3.5 text-primary-600 rounded"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={data.sig1_title}
                                                onChange={(e) => setData('sig1_title', e.target.value)}
                                                placeholder="المسمى الوظيفي"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                            <input
                                                type="text"
                                                value={data.sig1_name}
                                                onChange={(e) => setData('sig1_name', e.target.value)}
                                                placeholder="الاسم (اختياري)"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    {/* Signature 2 */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">الخانة 2: المراجع</span>
                                            <input
                                                type="checkbox"
                                                checked={data.sig2_active}
                                                onChange={(e) => setData('sig2_active', e.target.checked)}
                                                className="w-3.5 h-3.5 text-primary-600 rounded"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={data.sig2_title}
                                                onChange={(e) => setData('sig2_title', e.target.value)}
                                                placeholder="المسمى الوظيفي"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                            <input
                                                type="text"
                                                value={data.sig2_name}
                                                onChange={(e) => setData('sig2_name', e.target.value)}
                                                placeholder="الاسم (اختياري)"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    {/* Signature 3 */}
                                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-slate-800 dark:text-slate-200">الخانة 3: الاعتماد والختم</span>
                                            <input
                                                type="checkbox"
                                                checked={data.sig3_active}
                                                onChange={(e) => setData('sig3_active', e.target.checked)}
                                                className="w-3.5 h-3.5 text-primary-600 rounded"
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                value={data.sig3_title}
                                                onChange={(e) => setData('sig3_title', e.target.value)}
                                                placeholder="المسمى الوظيفي"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                            <input
                                                type="text"
                                                value={data.sig3_name}
                                                onChange={(e) => setData('sig3_name', e.target.value)}
                                                placeholder="الاسم (اختياري)"
                                                className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                                            />
                                        </div>
                                    </div>

                                    {/* Stamp Upload */}
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">ختم المدرسة (صورة مفرغة PNG)</label>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center p-1 overflow-hidden shrink-0">
                                                {stampPreview ? (
                                                    <img src={stampPreview} alt="Stamp" className="w-full h-full object-contain" />
                                                ) : (
                                                    <Stamp size={18} className="text-slate-400" />
                                                )}
                                            </div>
                                            <div className="space-y-1">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={handleStampChange}
                                                    className="text-xs text-slate-500 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-[11px] file:font-bold file:bg-primary-50 file:text-primary-700 cursor-pointer"
                                                />
                                                <label className="flex items-center gap-1.5 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.show_stamp}
                                                        onChange={(e) => setData('show_stamp', e.target.checked)}
                                                        className="w-3 h-3 text-primary-600 rounded"
                                                    />
                                                    <span className="text-[11px] text-slate-500 font-semibold">إظهار الختم في المعاينة والطباعة</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">جملة التذييل وإخلاء المسؤولية</label>
                                        <input
                                            type="text"
                                            value={data.footer_notice}
                                            onChange={(e) => setData('footer_notice', e.target.value)}
                                            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl shadow-lg shadow-primary-500/25 text-sm font-black transition-all disabled:opacity-50"
                                >
                                    <Save size={18} />
                                    <span>{processing ? 'جارٍ الحفظ...' : 'حفظ وتطبيق إعدادات التقارير'}</span>
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Right Column: Live Document Preview (معاينة حية فورية) */}
                    <div className={`space-y-4 ${activeTab === 'settings' ? 'hidden lg:block lg:col-span-6' : 'col-span-12 lg:col-span-7'}`}>
                        <div className="flex items-center justify-between px-2">
                            <div className="flex items-center gap-2">
                                <Monitor size={18} className="text-primary-600" />
                                <h3 className="text-sm font-black text-slate-800 dark:text-white">معاينة حية مباشرة لوثيقة التقرير (Live Document Preview)</h3>
                            </div>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
                                يتم التحديث لحظياً
                            </span>
                        </div>

                        {/* Simulated A4 Paper */}
                        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-2xl text-slate-800 relative min-h-[650px] flex flex-col justify-between overflow-hidden">
                            
                            {/* Watermark simulation */}
                            <div className="absolute inset-0 z-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                                {logoPreview && (
                                    <img src={logoPreview} className="w-80 h-80 object-contain grayscale" alt="watermark" />
                                )}
                            </div>

                            {/* Header Section in Preview */}
                            <div>
                                {data.show_header ? (
                                    <div className="relative mb-6 pb-4 border-b-2" style={{ borderColor: data.default_brand_color }}>
                                        {/* Accent bar */}
                                        <div className="absolute -top-6 inset-x-0 h-1.5" style={{ backgroundColor: data.default_brand_color }}></div>
                                        
                                        <div className="flex justify-between items-start pt-2">
                                            {/* Right: State & School info */}
                                            <div className="w-[40%] flex flex-col gap-0.5">
                                                <div className="flex items-center gap-1.5 mb-0.5">
                                                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.default_brand_color }}></div>
                                                    <span className="text-[10px] font-black text-slate-700">{data.republic}</span>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-600 pr-3">{data.ministry}</span>
                                                <h4 className="text-sm font-black text-slate-900 pr-3 mt-0.5">{data.school_name}</h4>
                                                <div className="text-[10px] text-slate-500 font-semibold pr-3 flex items-center gap-1 mt-0.5">
                                                    <span>{data.branch_name || 'المركز الرئيسي'}</span>
                                                    <span>•</span>
                                                    <span>{data.department_name}</span>
                                                </div>

                                                <div className="mt-2 pr-2.5 border-r-2" style={{ borderColor: data.default_brand_color }}>
                                                    <h3 className="text-xs font-black text-slate-900">تقرير المتابعة والغياب النموذجي</h3>
                                                </div>
                                            </div>

                                            {/* Center: Logo */}
                                            <div className="w-[20%] flex justify-center">
                                                <div className="w-14 h-14 bg-white flex items-center justify-center p-1">
                                                    {logoPreview && (
                                                        <img src={logoPreview} alt="Logo" className="w-full h-full object-contain filter drop-shadow-xs" />
                                                    )}
                                                </div>
                                            </div>

                                            {/* Left: Meta details & QR */}
                                            <div className="w-[40%] flex justify-end">
                                                {data.show_qr_code ? (
                                                    <div className="w-full max-w-[190px] border border-slate-200 rounded-lg p-2 bg-slate-50/50 flex flex-col gap-1 text-[9px]">
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold">رقم الوثيقة:</span>
                                                            <span className="font-mono font-black" dir="ltr">DOC-26-8492</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold">تاريخ الطباعة:</span>
                                                            <span className="font-mono font-bold" dir="ltr">2026/11/14</span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-slate-400 font-bold">العام الدراسي:</span>
                                                            <span className="font-mono font-bold" dir="ltr">2026-2027</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-[10px] text-slate-400 font-bold">الرقم: DOC-26-8492</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-16 w-full border border-dashed border-slate-200 rounded-xl mb-6 flex items-center justify-center text-slate-400 text-xs font-bold">
                                        [مساحة مخصصة لورق المدرسة الرسمي المطبوع مسبقاً - الترويسة مخفية]
                                    </div>
                                )}

                                {/* Dummy Sample Table Content */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                        <span>بيانات تجريبية للمعاينة الحية:</span>
                                        <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">معتمد للطباعة</span>
                                    </div>

                                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                                        <table className="w-full text-right text-[11px]">
                                            <thead>
                                                <tr style={{ backgroundColor: data.default_brand_color, color: 'white' }}>
                                                    <th className="p-2 text-center w-8">م</th>
                                                    <th className="p-2">الاسم / السجل</th>
                                                    <th className="p-2 text-center">الصف والشعبة</th>
                                                    <th className="p-2 text-center">التاريخ</th>
                                                    <th className="p-2 text-center">الحالة</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-2 text-center font-bold">1</td>
                                                    <td className="p-2 font-bold text-slate-800">أحمد محمد عبد الله</td>
                                                    <td className="p-2 text-center text-slate-600">الثالث الثانوي (أ)</td>
                                                    <td className="p-2 text-center font-mono">2026/11/14</td>
                                                    <td className="p-2 text-center">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">حاضر</span>
                                                    </td>
                                                </tr>
                                                <tr className="hover:bg-slate-50">
                                                    <td className="p-2 text-center font-bold">2</td>
                                                    <td className="p-2 font-bold text-slate-800">خالد سالم القحطاني</td>
                                                    <td className="p-2 text-center text-slate-600">الثالث الثانوي (ب)</td>
                                                    <td className="p-2 text-center font-mono">2026/11/14</td>
                                                    <td className="p-2 text-center">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800">غائب</span>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Footer & Signatures Section in Preview */}
                            {data.show_footer && (
                                <div className="mt-8 pt-4 border-t border-slate-200">
                                    {/* Signatures & Stamp */}
                                    {data.show_signatures && (
                                        <div className="grid grid-cols-3 gap-4 mb-6 text-center text-[10px]">
                                            
                                            {/* Sig 1 */}
                                            {data.sig1_active ? (
                                                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[70px]">
                                                    <span className="font-bold text-slate-700 pb-1 border-b border-slate-200">{data.sig1_title}</span>
                                                    <span className="text-[9px] text-slate-400 italic">{data.sig1_name || 'التوقيع: .........'}</span>
                                                </div>
                                            ) : <div></div>}

                                            {/* Sig 2 */}
                                            {data.sig2_active ? (
                                                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[70px]">
                                                    <span className="font-bold text-slate-700 pb-1 border-b border-slate-200">{data.sig2_title}</span>
                                                    <span className="text-[9px] text-slate-400 italic">{data.sig2_name || 'التوقيع: .........'}</span>
                                                </div>
                                            ) : <div></div>}

                                            {/* Sig 3 & Stamp */}
                                            {data.sig3_active ? (
                                                <div className="border border-slate-200 rounded-xl p-2.5 bg-slate-50/50 flex flex-col justify-between min-h-[70px] relative overflow-hidden">
                                                    <span className="font-bold text-slate-700 pb-1 border-b border-slate-200">{data.sig3_title}</span>
                                                    <div className="h-6 flex items-center justify-center relative">
                                                        {data.show_stamp && stampPreview ? (
                                                            <img src={stampPreview} alt="Stamp" className="h-10 w-10 object-contain absolute opacity-80 -rotate-6 pointer-events-none" />
                                                        ) : (
                                                            <span className="text-[9px] text-slate-400 italic">{data.sig3_name || 'التوقيع والختم: .........'}</span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : <div></div>}

                                        </div>
                                    )}

                                    {/* Bottom Line */}
                                    <div className="flex justify-between items-center text-[9px] text-slate-400 pt-2 border-t border-slate-100">
                                        <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.default_brand_color }}></span>
                                            <span className="truncate">{data.footer_notice}</span>
                                        </div>
                                        <div className="flex items-center gap-2 font-mono" dir="ltr">
                                            {data.show_page_number && <span>Page 1 of 1</span>}
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </div>

                </div>

            </div>
        </AdminLayout>
    );
}
