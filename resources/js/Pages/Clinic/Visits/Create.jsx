import React, { useEffect, useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { HeartPulse, ArrowRight, User, Search, Save, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Stethoscope, Activity, Sparkles, Home, Ambulance, ShieldAlert } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import axios from 'axios';
import debounce from 'lodash/debounce';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Create({ student }) {
    const { data, setData, post, processing, errors } = useForm({
        student_id: student?.id || '',
        symptoms: '',
        action_taken: '',
        status: 'returned_to_class',
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(student || null);
    const [isSearching, setIsSearching] = useState(false);
    const [currentStep, setCurrentStep] = useState(student ? 2 : 1);

    const commonSymptoms = ['صداع', 'مغص في البطن', 'ارتفاع في الحرارة', 'جرح سطحي', 'غثيان', 'إرهاق وتعب', 'ألم في الأسنان'];
    const commonActions = ['إعطاء مسكن بسيط', 'تطهير وتضميد الجرح', 'قياس الحرارة والضغط', 'راحة في العيادة 15 دقيقة', 'كمادات باردة'];

    const handleSearch = debounce(async (query) => {
        if (!query || query.length < 2) {
            setSearchResults([]);
            return;
        }
        setIsSearching(true);
        try {
            const response = await axios.get(route('clinic.search-students'), { params: { query } });
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching students', error);
        } finally {
            setIsSearching(false);
        }
    }, 500);

    const onSearchChange = (e) => {
        setSearchQuery(e.target.value);
        handleSearch(e.target.value);
    };

    const selectStudent = (std) => {
        setSelectedStudent(std);
        setData('student_id', std.id);
        setSearchQuery('');
        setSearchResults([]);
        setTimeout(() => setCurrentStep(2), 300);
    };

    const addSymptomTag = (tag) => {
        if (data.symptoms.includes(tag)) return;
        setData('symptoms', data.symptoms ? `${data.symptoms}، ${tag}` : tag);
    };

    const addActionTag = (tag) => {
        if (data.action_taken.includes(tag)) return;
        setData('action_taken', data.action_taken ? `${data.action_taken}، ${tag}` : tag);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('clinic.visits.store'));
    };

    const steps = [
        { id: 1, name: 'تحديد الطالب', icon: User, desc: 'البحث وعرض التنبيهات' },
        { id: 2, name: 'الأعراض والعلاج', icon: Stethoscope, desc: 'تسجيل الشكوى والإجراء' },
        { id: 3, name: 'قرار الخروج', icon: Activity, desc: 'تحديد الحالة النهائية' },
    ];

    const getInitials = (name) => {
        if (!name) return 'ط';
        const parts = name.split(' ');
        if (parts.length >= 2) return parts[0][0] + ' ' + parts[1][0];
        return name.substring(0, 2);
    };

    const isStepValid = (step) => {
        if (step === 1) return !!selectedStudent;
        if (step === 2) return data.symptoms.trim().length > 0;
        if (step === 3) return data.action_taken.trim().length > 0 && !!data.status;
        return true;
    };

    return (
        <AdminLayout activeMenu="العيادة المدرسية">
            <Head title="تسجيل زيارة عيادة | النظام الإداري" />

            <div className="p-6 space-y-6">
                
                {/* Header Section with Brand Colors and Geometric Accent (Shifts Style) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                    {/* Brand Line Accent */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-rose-500 to-indigo-600" />
                    
                    {/* Fine abstract geometric background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                        <svg className="w-full h-full" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M-50 120 C 150 20, 250 280, 450 120 C 650 -40, 750 220, 950 120" stroke="currentColor" strokeWidth="2.5" className="text-indigo-600" />
                            <path d="M-50 145 C 170 45, 270 305, 470 145 C 670 -15, 770 245, 970 145" stroke="currentColor" strokeWidth="1" className="text-indigo-500" fill="none" />
                            <circle cx="250" cy="90" r="4" className="fill-indigo-500" />
                            <circle cx="500" cy="160" r="6" className="fill-indigo-400" />
                            <circle cx="750" cy="60" r="3" className="fill-indigo-300" />
                        </svg>
                    </div>

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <Link href={route('clinic.index')} className="p-3 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 transition-all shadow-sm shrink-0">
                                <ArrowRight size={22} />
                            </Link>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">تسجيل زيارة عيادة جديدة</h1>
                                <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-1 text-sm font-semibold">توثيق مراجعة الطالب للعيادة، الأعراض، الإجراء المتخذ وقرار الخروج</p>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Step Wizard Header */}
                    <div className="bg-white/80 backdrop-blur-md rounded-3xl p-6 border border-slate-200 shadow-sm">
                        <nav aria-label="Progress">
                            <ol role="list" className="flex items-center justify-between">
                                {steps.map((step, stepIdx) => (
                                    <li key={step.name} className="flex-1 relative">
                                        <div className="flex items-center gap-4">
                                            <div
                                                className={classNames(
                                                    "relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 transition-all duration-300 shadow-sm shrink-0",
                                                    step.id < currentStep ? 'bg-indigo-600 border-indigo-600 text-white' : 
                                                    step.id === currentStep ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50' : 'bg-slate-50 border-slate-200 text-slate-400'
                                                )}
                                            >
                                                <step.icon size={26} />
                                            </div>
                                            <div className="hidden sm:block">
                                                <span className={classNames(
                                                    "block text-base font-black transition-colors",
                                                    step.id <= currentStep ? 'text-slate-900' : 'text-slate-400'
                                                )}>
                                                    {step.name}
                                                </span>
                                                <span className="text-xs text-slate-500 font-medium">{step.desc}</span>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </div>

                    {/* Form Container with Soft Shadows and Glassmorphism */}
                    <form onSubmit={submit} className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
                        <div className="p-8 sm:p-10 min-h-[440px]">

                            {/* STEP 1: Student Search & Selection */}
                            {currentStep === 1 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="text-center max-w-lg mx-auto">
                                        <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-indigo-50 text-indigo-600 mb-4 border border-indigo-100 shadow-inner">
                                            <Search size={36} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900">البحث عن الطالب</h3>
                                        <p className="text-slate-500 mt-2 font-medium">أدخل اسم الطالب أو رقم السجل المدني للبدء بتسجيل الزيارة</p>
                                    </div>
                                    
                                    <div className="max-w-xl mx-auto relative">
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 right-0 flex items-center pr-5 pointer-events-none">
                                                <Search className="h-6 w-6 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                            </div>
                                            <input
                                                type="text"
                                                className="block w-full pl-5 pr-14 py-4 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-600 bg-slate-50/50 focus:bg-white transition-all text-lg font-bold shadow-sm"
                                                placeholder="اكتب اسم الطالب..."
                                                value={searchQuery}
                                                onChange={onSearchChange}
                                            />
                                        </div>
                                        
                                        {searchResults.length > 0 && (
                                            <ul className="absolute z-20 w-full mt-2 bg-white/95 backdrop-blur-lg border border-slate-200 rounded-2xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100">
                                                {searchResults.map((std) => (
                                                    <li key={std.id}>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectStudent(std)}
                                                            className="w-full text-right p-4 hover:bg-indigo-50/80 transition-colors flex items-center justify-between group"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-lg shadow-sm">
                                                                    {getInitials(std.name)}
                                                                </div>
                                                                <div>
                                                                    <p className="font-black text-slate-900 group-hover:text-indigo-700 text-base">{std.name}</p>
                                                                    <p className="text-xs text-slate-500 font-bold">{std.grade?.name} - {std.division?.name}</p>
                                                                </div>
                                                            </div>
                                                            <ChevronLeft className="text-slate-300 group-hover:text-indigo-600 transition-transform group-hover:-translate-x-1" />
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                        <InputError message={errors.student_id} className="mt-2 text-center" />
                                    </div>

                                    {/* Selected Student Card with Medical Alerts */}
                                    {selectedStudent && (
                                        <div className="max-w-xl mx-auto p-6 border-2 border-emerald-200 bg-emerald-50/40 rounded-3xl shadow-sm space-y-4 animate-in zoom-in-95 duration-300">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-md">
                                                        {getInitials(selectedStudent.name)}
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-black text-emerald-700 uppercase tracking-wider block mb-0.5">الطالب المحدد</span>
                                                        <h4 className="text-xl font-black text-slate-900">{selectedStudent.name}</h4>
                                                        <p className="text-xs text-slate-500 font-bold mt-0.5">{selectedStudent.grade?.name} - {selectedStudent.division?.name}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    type="button" 
                                                    onClick={() => { setSelectedStudent(null); setData('student_id', ''); }}
                                                    className="text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
                                                >
                                                    تغيير
                                                </button>
                                            </div>

                                            {/* Medical Alert Preview */}
                                            {selectedStudent.medical_record && (selectedStudent.medical_record.allergies || selectedStudent.medical_record.chronic_diseases) ? (
                                                <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 space-y-2">
                                                    <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                                                        <AlertTriangle size={18} className="text-amber-600" />
                                                        <span>تنبيه طبي خاص بالطالب:</span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-2 text-xs font-bold">
                                                        {selectedStudent.medical_record.allergies && (
                                                            <span className="bg-red-50 text-red-700 px-3 py-1 rounded-lg border border-red-200">
                                                                حساسية: {selectedStudent.medical_record.allergies}
                                                            </span>
                                                        )}
                                                        {selectedStudent.medical_record.chronic_diseases && (
                                                            <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-lg border border-amber-200">
                                                                مرض مزمن: {selectedStudent.medical_record.chronic_diseases}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-xs text-emerald-800 font-bold flex items-center gap-2 bg-white/60 p-3 rounded-xl border border-emerald-100">
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                    لا توجد تنبيهات أو حساسية مسبقة مسجلة.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* STEP 2: Symptoms & Actions Registration */}
                            {currentStep === 2 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {selectedStudent && (
                                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">
                                                    {getInitials(selectedStudent.name)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-900">{selectedStudent.name}</p>
                                                    <p className="text-xs text-slate-500 font-bold">{selectedStudent.grade?.name} - {selectedStudent.division?.name}</p>
                                                </div>
                                            </div>
                                            <Link href={route('clinic.records.show', selectedStudent.id)} target="_blank" className="text-xs text-indigo-600 hover:underline font-bold">
                                                الملف الطبي الكامل &rarr;
                                            </Link>
                                        </div>
                                    )}

                                    {/* Symptoms Input */}
                                    <div>
                                        <InputLabel htmlFor="symptoms" value="الأعراض أو شكوى الطالب" className="text-lg font-black text-slate-900 mb-2" />
                                        <textarea
                                            id="symptoms"
                                            className="block w-full border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl shadow-sm p-4 text-base font-bold bg-slate-50/50 focus:bg-white transition-all resize-none"
                                            rows="4"
                                            value={data.symptoms}
                                            onChange={(e) => setData('symptoms', e.target.value)}
                                            placeholder="صف الأعراض التي يشكي منها الطالب بدقة..."
                                            required
                                        />
                                        
                                        {/* Quick Symptom Tags */}
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                <Sparkles size={14} className="text-indigo-500" /> اقتراحات سريعة:
                                            </span>
                                            {commonSymptoms.map((sym) => (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    onClick={() => addSymptomTag(sym)}
                                                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold transition-all border border-slate-200 hover:border-indigo-200"
                                                >
                                                    + {sym}
                                                </button>
                                            ))}
                                        </div>
                                        <InputError message={errors.symptoms} className="mt-2" />
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: Treatment Action & Disposition Cards */}
                            {currentStep === 3 && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Action Taken Input */}
                                    <div>
                                        <InputLabel htmlFor="action_taken" value="الإجراء المتخذ (العلاج)" className="text-lg font-black text-slate-900 mb-2" />
                                        <textarea
                                            id="action_taken"
                                            className="block w-full border-2 border-slate-200 focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 rounded-2xl shadow-sm p-4 text-base font-bold bg-slate-50/50 focus:bg-white transition-all resize-none"
                                            rows="3"
                                            value={data.action_taken}
                                            onChange={(e) => setData('action_taken', e.target.value)}
                                            placeholder="اكتب الإسعافات المقدمة للطالب..."
                                            required
                                        />
                                        
                                        {/* Quick Action Tags */}
                                        <div className="mt-3 flex flex-wrap items-center gap-2">
                                            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                                                <Sparkles size={14} className="text-indigo-500" /> إجراءات متكررة:
                                            </span>
                                            {commonActions.map((act) => (
                                                <button
                                                    key={act}
                                                    type="button"
                                                    onClick={() => addActionTag(act)}
                                                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 text-xs font-bold transition-all border border-slate-200 hover:border-teal-200"
                                                >
                                                    + {act}
                                                </button>
                                            ))}
                                        </div>
                                        <InputError message={errors.action_taken} className="mt-2" />
                                    </div>

                                    {/* Rich Radio Cards for Disposition Status */}
                                    <div>
                                        <InputLabel htmlFor="status" value="قرار الخروج والحالة النهائية (Disposition)" className="text-lg font-black text-slate-900 mb-4" />
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                            {/* Green Card: Return to class */}
                                            <label className={classNames(
                                                "cursor-pointer rounded-3xl border-2 p-6 flex flex-col items-center text-center transition-all relative overflow-hidden group shadow-sm hover:shadow-md",
                                                data.status === 'returned_to_class'
                                                    ? 'bg-gradient-to-b from-emerald-50 to-emerald-100/50 border-emerald-500 ring-4 ring-emerald-100 transform scale-[1.02]'
                                                    : 'bg-white border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20'
                                            )}>
                                                <input
                                                    type="radio"
                                                    className="sr-only"
                                                    name="status"
                                                    value="returned_to_class"
                                                    checked={data.status === 'returned_to_class'}
                                                    onChange={(e) => setData('status', e.target.value)}
                                                />
                                                <div className={classNames("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-sm", data.status === 'returned_to_class' ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-600")}>
                                                    <CheckCircle2 size={36} />
                                                </div>
                                                <span className={classNames("font-black text-xl block mb-1", data.status === 'returned_to_class' ? "text-emerald-900" : "text-slate-800")}>عودة للفصل</span>
                                                <span className="text-xs text-slate-500 font-bold">الحالة مستقرة ويمكن إكمال اليوم الدراسي</span>
                                            </label>
                                            
                                            {/* Yellow Card: Sent home */}
                                            <label className={classNames(
                                                "cursor-pointer rounded-3xl border-2 p-6 flex flex-col items-center text-center transition-all relative overflow-hidden group shadow-sm hover:shadow-md",
                                                data.status === 'sent_home'
                                                    ? 'bg-gradient-to-b from-amber-50 to-amber-100/50 border-amber-500 ring-4 ring-amber-100 transform scale-[1.02]'
                                                    : 'bg-white border-slate-200 hover:border-amber-300 hover:bg-amber-50/20'
                                            )}>
                                                <input
                                                    type="radio"
                                                    className="sr-only"
                                                    name="status"
                                                    value="sent_home"
                                                    checked={data.status === 'sent_home'}
                                                    onChange={(e) => setData('status', e.target.value)}
                                                />
                                                <div className={classNames("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-sm", data.status === 'sent_home' ? "bg-amber-500 text-white" : "bg-amber-100 text-amber-600")}>
                                                    <Home size={36} />
                                                </div>
                                                <span className={classNames("font-black text-xl block mb-1", data.status === 'sent_home' ? "text-amber-900" : "text-slate-800")}>مغادرة للمنزل</span>
                                                <span className="text-xs text-slate-500 font-bold">استدعاء ولي الأمر لاصطحاب الطالب</span>
                                            </label>

                                            {/* Red Card: Emergency */}
                                            <label className={classNames(
                                                "cursor-pointer rounded-3xl border-2 p-6 flex flex-col items-center text-center transition-all relative overflow-hidden group shadow-sm hover:shadow-md",
                                                data.status === 'emergency'
                                                    ? 'bg-gradient-to-b from-rose-50 to-rose-100/50 border-rose-500 ring-4 ring-rose-100 transform scale-[1.02]'
                                                    : 'bg-white border-slate-200 hover:border-rose-300 hover:bg-rose-50/20'
                                            )}>
                                                <input
                                                    type="radio"
                                                    className="sr-only"
                                                    name="status"
                                                    value="emergency"
                                                    checked={data.status === 'emergency'}
                                                    onChange={(e) => setData('status', e.target.value)}
                                                />
                                                <div className={classNames("p-4 rounded-2xl mb-4 transition-transform group-hover:scale-110 shadow-sm", data.status === 'emergency' ? "bg-rose-600 text-white" : "bg-rose-100 text-rose-600")}>
                                                    <Ambulance size={36} />
                                                </div>
                                                <span className={classNames("font-black text-xl block mb-1", data.status === 'emergency' ? "text-rose-900" : "text-slate-800")}>حالة طارئة</span>
                                                <span className="text-xs text-slate-500 font-bold">طلب إسعاف عاجل ونقل للمستشفى</span>
                                            </label>
                                        </div>
                                        <InputError message={errors.status} className="mt-2" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Wizard Footer Controls */}
                        <div className="p-6 sm:px-10 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev - 1)}
                                    className="px-6 py-3 border border-slate-300 bg-white rounded-2xl text-slate-700 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
                                >
                                    <ChevronRight size={20} />
                                    السابق
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {currentStep < 3 ? (
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(prev => prev + 1)}
                                    disabled={!isStepValid(currentStep)}
                                    className="px-8 py-3.5 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                                >
                                    التالي
                                    <ChevronLeft size={20} />
                                </button>
                            ) : (
                                <PrimaryButton disabled={processing || !isStepValid(3)} className="rounded-2xl px-10 py-3.5 text-lg font-black shadow-lg hover:shadow-xl gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Save size={22} />
                                    حفظ وإنهاء الزيارة
                                </PrimaryButton>
                            )}
                        </div>
                    </form>
                </div>
        </AdminLayout>
    );
}

