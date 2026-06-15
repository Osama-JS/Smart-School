import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import axios from 'axios';
import { Store, User, Lock, Mail, Server, ShieldCheck, CheckCircle2, MapPin, Phone, Loader2, AlertCircle } from 'lucide-react';
import FlatpickrInput from '@/Components/FlatpickrInput';

export default function Wizard() {
    const { data, setData, post, processing, errors } = useForm({
        admin_name: 'مدير النظام',
        admin_username: 'admin',
        admin_password: '',
        admin_password_confirmation: '',
        branch_name: 'الفرع الرئيسي',
        branch_address: '',
        branch_phone: '',
        academic_year_name: '2025/2026',
        academic_year_start: '',
        academic_year_end: '',
        install_dummy_data: true,
    });

    const [step, setStep] = useState(1);
    const [isInstalling, setIsInstalling] = useState(false);
    const [installError, setInstallError] = useState(null);
    const [installProgress, setInstallProgress] = useState([
        { id: 'migrate', title: 'تهيئة قواعد البيانات (Migrations)', status: 'pending' }, // pending, loading, success, error
        { id: 'branch_and_roles', title: 'إعداد الفرع الأساسي وهيكلة الأدوار', status: 'pending' },
        { id: 'admin_and_permissions', title: 'إنشاء مدير النظام وبناء الصلاحيات', status: 'pending' },
        { id: 'dummy_data', title: 'توليد البيانات التجريبية المتوافقة', status: 'pending', conditional: true },
    ]);

    const submit = async (e) => {
        e.preventDefault();
        setIsInstalling(true);
        setInstallError(null);
        
        let stepsToRun = [...installProgress];
        if (!data.install_dummy_data) {
            stepsToRun = stepsToRun.filter(s => s.id !== 'dummy_data');
        }

        try {
            for (let i = 0; i < stepsToRun.length; i++) {
                const currentStep = stepsToRun[i];
                
                // Update status to loading
                setInstallProgress(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'loading' } : s));
                
                // Call API
                const response = await axios.post(route('install.step'), {
                    step: currentStep.id,
                    ...data
                });

                if (response.data.success) {
                    // Update status to success
                    setInstallProgress(prev => prev.map(s => s.id === currentStep.id ? { ...s, status: 'success' } : s));
                } else {
                    throw new Error(response.data.error || 'خطأ غير معروف');
                }
            }
            
            // All steps completed successfully, redirect to dashboard
            setTimeout(() => {
                window.location.href = route('dashboard');
            }, 1000);

        } catch (error) {
            setInstallError(error.response?.data?.error || error.message || 'حدث خطأ أثناء الاتصال بالخادم.');
            // Mark the currently loading step as error
            setInstallProgress(prev => prev.map(s => s.status === 'loading' ? { ...s, status: 'error' } : s));
        }
    };

    if (isInstalling) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
                <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center animate-in zoom-in duration-500">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        {installError ? (
                            <div className="absolute inset-0 border-4 border-red-500 rounded-full"></div>
                        ) : (
                            <div className="absolute inset-0 border-4 border-primary-500 rounded-full border-t-transparent animate-spin"></div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {installError ? (
                                <AlertCircle className="w-8 h-8 text-red-500" />
                            ) : (
                                <Server className="w-8 h-8 text-primary-500 animate-pulse" />
                            )}
                        </div>
                    </div>
                    
                    <h2 className={`text-2xl font-black mb-3 ${installError ? 'text-red-600' : 'text-slate-800'}`}>
                        {installError ? 'فشل التثبيت' : 'جاري تجهيز النظام...'}
                    </h2>
                    
                    <p className="text-slate-500 font-medium mb-6">
                        {installError ? installError : 'يرجى الانتظار وعدم إغلاق الصفحة، نقوم بالعمليات التالية تباعاً.'}
                    </p>
                    
                    <div className="space-y-4 text-sm text-slate-700 font-medium text-right bg-slate-50 p-5 rounded-2xl border border-slate-100 shadow-inner">
                        {installProgress.filter(s => !s.conditional || data.install_dummy_data).map((stepItem, idx) => (
                            <div key={idx} className={`flex items-center gap-3 transition-opacity duration-300 ${stepItem.status === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
                                {stepItem.status === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />}
                                {stepItem.status === 'loading' && <Loader2 className="w-5 h-5 text-primary-500 animate-spin shrink-0" />}
                                {stepItem.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-slate-300 shrink-0"></div>}
                                {stepItem.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
                                <span className={stepItem.status === 'error' ? 'text-red-600 font-bold' : ''}>{stepItem.title}</span>
                            </div>
                        ))}
                    </div>

                    {installError && (
                        <button 
                            onClick={() => {
                                setIsInstalling(false);
                                setInstallError(null);
                                setInstallProgress(prev => prev.map(s => ({ ...s, status: 'pending' })));
                            }}
                            className="mt-6 text-sm font-bold text-slate-500 hover:text-slate-800 underline underline-offset-4"
                        >
                            العودة وتصحيح البيانات
                        </button>
                    )}
                </div>
            </div>
        );
    }



    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans" dir="rtl">
            <Head title="تثبيت النظام" />

            <div className="bg-white rounded-3xl shadow-xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row">
                
                {/* Right Side - Branding */}
                <div className="bg-gradient-to-br from-primary-600 to-primary-800 p-10 text-white md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[-50px] left-[-50px] w-64 h-64 bg-black/10 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6 ring-1 ring-white/30 shadow-lg">
                            <ShieldCheck className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-3xl font-black mb-4 leading-tight">مرحباً بك في<br/>نظام إدارة المدارس (ERP)</h1>
                        <p className="text-primary-100 font-medium text-sm leading-relaxed">
                            مرحلة التثبيت الأولى، سنقوم بإعداد النظام وتهيئة الفرع الأساسي وحساب مدير النظام لتتمكن من الانطلاق.
                        </p>
                    </div>

                    <div className="relative z-10 mt-12 space-y-4">
                        <div className={`flex items-center gap-4 transition-opacity ${step === 1 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 1 ? 'bg-white text-primary-600 shadow-md' : 'border-2 border-white/30 text-white'}`}>1</div>
                            <span className="font-bold">بيانات الفرع الرئيسي</span>
                        </div>
                        <div className={`flex items-center gap-4 transition-opacity ${step === 2 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 2 ? 'bg-white text-primary-600 shadow-md' : 'border-2 border-white/30 text-white'}`}>2</div>
                            <span className="font-bold">السنة الدراسية</span>
                        </div>
                        <div className={`flex items-center gap-4 transition-opacity ${step === 3 ? 'opacity-100' : 'opacity-50'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 3 ? 'bg-white text-primary-600 shadow-md' : 'border-2 border-white/30 text-white'}`}>3</div>
                            <span className="font-bold">حساب مدير النظام</span>
                        </div>
                    </div>
                </div>

                {/* Left Side - Form */}
                <div className="p-8 md:p-12 md:w-3/5">
                    <form onSubmit={submit}>
                        
                        {step === 1 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-black text-slate-800 mb-2">إعداد الفرع الأساسي</h2>
                                <p className="text-slate-500 text-sm font-medium mb-8">قم بإدخال بيانات الفرع الرئيسي أو المركز الرئيسي للمؤسسة.</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم الفرع *</label>
                                        <div className="relative">
                                            <Store className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                value={data.branch_name}
                                                onChange={e => setData('branch_name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {errors.branch_name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.branch_name}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الفرع</label>
                                        <div className="relative">
                                            <MapPin className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                value={data.branch_address}
                                                onChange={e => setData('branch_address', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">هاتف الفرع</label>
                                        <div className="relative">
                                            <Phone className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                value={data.branch_phone}
                                                onChange={e => setData('branch_phone', e.target.value)}
                                                dir="ltr"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-end">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        disabled={!data.branch_name}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        التالي
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <h2 className="text-2xl font-black text-slate-800 mb-2">إعداد السنة الدراسية الأولى</h2>
                                <p className="text-slate-500 text-sm font-medium mb-8">قم بتحديد الفترة الزمنية لأول سنة دراسية في هذا الفرع.</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم السنة الدراسية *</label>
                                        <input 
                                            type="text" 
                                            placeholder="مثال: 2025/2026"
                                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                            value={data.academic_year_name}
                                            onChange={e => setData('academic_year_name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ البداية *</label>
                                            <FlatpickrInput 
                                                value={data.academic_year_start}
                                                onChange={date => setData('academic_year_start', date)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                placeholder="تاريخ بداية السنة"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ النهاية *</label>
                                            <FlatpickrInput 
                                                value={data.academic_year_end}
                                                onChange={date => setData('academic_year_end', date)}
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                placeholder="تاريخ نهاية السنة"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-between items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(1)}
                                        className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
                                    >
                                        السابق
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(3)}
                                        disabled={!data.academic_year_name || !data.academic_year_start || !data.academic_year_end}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        التالي
                                    </button>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                                <h2 className="text-2xl font-black text-slate-800 mb-2">حساب مدير النظام</h2>
                                <p className="text-slate-500 text-sm font-medium mb-8">قم بإنشاء حساب المدير المؤسس والذي يمتلك كافة الصلاحيات.</p>

                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل *</label>
                                        <div className="relative">
                                            <User className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                value={data.admin_name}
                                                onChange={e => setData('admin_name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        {errors.admin_name && <p className="text-red-500 text-xs mt-1 font-bold">{errors.admin_name}</p>}
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">اسم المستخدم للدخول *</label>
                                        <div className="relative">
                                            <Mail className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                value={data.admin_username}
                                                onChange={e => setData('admin_username', e.target.value)}
                                                dir="ltr"
                                                required
                                            />
                                        </div>
                                        {errors.admin_username && <p className="text-red-500 text-xs mt-1 font-bold">{errors.admin_username}</p>}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">كلمة المرور *</label>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                                <input 
                                                    type="password" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                    value={data.admin_password}
                                                    onChange={e => setData('admin_password', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            {errors.admin_password && <p className="text-red-500 text-xs mt-1 font-bold">{errors.admin_password}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-bold text-slate-700 mb-2">تأكيد المرور *</label>
                                            <div className="relative">
                                                <Lock className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
                                                <input 
                                                    type="password" 
                                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all font-medium text-slate-700" 
                                                    value={data.admin_password_confirmation}
                                                    onChange={e => setData('admin_password_confirmation', e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 p-4 bg-primary-50 rounded-xl border border-primary-100">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                className="w-5 h-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500" 
                                                checked={data.install_dummy_data}
                                                onChange={e => setData('install_dummy_data', e.target.checked)}
                                            />
                                            <div>
                                                <span className="block font-bold text-slate-800 text-sm">تثبيت بيانات تجريبية (Dummy Data)</span>
                                                <span className="block text-xs text-slate-500 mt-0.5">يقوم بتوليد أقسام، درجات وظيفية، شفتات، وموظفين للتجربة.</span>
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                <div className="mt-10 flex justify-between items-center">
                                    <button 
                                        type="button" 
                                        onClick={() => setStep(2)}
                                        className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2"
                                    >
                                        السابق
                                    </button>
                                    <button 
                                        type="submit" 
                                        disabled={!data.admin_name || !data.admin_username || !data.admin_password || data.admin_password !== data.admin_password_confirmation}
                                        className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-xl font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        <CheckCircle2 className="w-5 h-5" />
                                        تثبيت النظام
                                    </button>
                                </div>
                            </div>
                        )}
                        
                    </form>
                </div>
            </div>
        </div>
    );
}
