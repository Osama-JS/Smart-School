import React, { useState } from 'react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Head, Link, useForm } from '@inertiajs/react';
import { HeartPulse, ArrowRight, User, AlertTriangle, Save, Activity, FileText, FileSignature, Stethoscope, Droplet, Weight, Ruler, Pill, Scissors, ShieldAlert, Sparkles } from 'lucide-react';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import { Tab } from '@headlessui/react';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

export default function Show({ student }) {
    const medicalRecord = student.medicalRecord || {};

    const { data, setData, post, processing, errors } = useForm({
        height: medicalRecord.height || '',
        weight: medicalRecord.weight || '',
        blood_type: medicalRecord.blood_type || '',
        allergies: medicalRecord.allergies || '',
        chronic_diseases: medicalRecord.chronic_diseases || '',
        regular_medications: medicalRecord.regular_medications || '',
        past_surgeries: medicalRecord.past_surgeries || '',
        consent_given: medicalRecord.consent_given || false,
    });

    const [isEditing, setIsEditing] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const submit = (e) => {
        e.preventDefault();
        post(route('clinic.records.update', student.id), {
            preserveScroll: true,
            onSuccess: () => setIsEditing(false),
        });
    };

    const getInitials = (name) => {
        if (!name) return 'ط';
        const parts = name.split(' ');
        if (parts.length >= 2) return parts[0][0] + ' ' + parts[1][0];
        return name.substring(0, 2);
    };

    // Dynamic BMI Calculation & Status Categorization
    const calculateBMI = () => {
        if (!data.height || !data.weight || parseFloat(data.height) <= 0) return null;
        const hInMeters = parseFloat(data.height) / 100;
        const bmiVal = (parseFloat(data.weight) / (hInMeters * hInMeters)).toFixed(1);
        
        let category = { label: 'طبيعي', color: 'bg-emerald-500 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'وزن مثالي وطبيعي' };
        if (bmiVal < 18.5) {
            category = { label: 'نقص وزن', color: 'bg-blue-500 text-white', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200', text: 'وزن أقل من الطبيعي' };
        } else if (bmiVal >= 18.5 && bmiVal <= 24.9) {
            category = { label: 'وزن طبيعي', color: 'bg-emerald-500 text-white', badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'وزن مثالي وطبيعي' };
        } else if (bmiVal >= 25.0 && bmiVal <= 29.9) {
            category = { label: 'زيادة وزن', color: 'bg-amber-500 text-white', badgeBg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'وزن زائد عن الطبيعي' };
        } else {
            category = { label: 'سمنة', color: 'bg-rose-600 text-white', badgeBg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'سمنة تجب متابعتها' };
        }

        return { val: bmiVal, ...category };
    };

    const bmiInfo = calculateBMI();

    return (
        <AdminLayout activeMenu="العيادة المدرسية">
            <Head title={`الملف الطبي - ${student.name} | النظام الإداري`} />

            <div className="p-6 space-y-6">
                
                {/* Header Section with Brand Colors and Geometric Accent (Shifts Style) */}
                <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 via-white to-white dark:from-indigo-500/10 dark:via-[#121820]/95 dark:to-[#121820]/95 border border-indigo-100 dark:border-indigo-500/10 rounded-3xl p-6 md:p-8 mb-8 shadow-sm dark:shadow-none">
                    {/* Brand Line Accent */}
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600" />
                    
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
                                <h1 className="text-2xl md:text-3xl font-black text-dark-900 dark:text-white tracking-tight">الملف الطبي للطالب</h1>
                                <p className="text-indigo-700/80 dark:text-indigo-300/80 mt-1 text-sm font-semibold">استعراض وتحديث المؤشرات الحيوية والتاريخ الطبي والعمليات الإقرارية</p>
                            </div>
                        </div>
                    </div>
                </div>

                    {/* Prominent Emergency Alert Banner */}
                    {(data.allergies || data.chronic_diseases) && (
                        <div className="bg-gradient-to-r from-rose-500 to-red-600 rounded-3xl p-6 text-white shadow-lg animate-pulse border-2 border-rose-300">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shrink-0">
                                    <ShieldAlert size={32} className="text-white" />
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-xl font-black flex items-center gap-2">
                                        تنبيه طبي مهم للطبيب / الممرض
                                    </h4>
                                    <div className="flex flex-wrap gap-4 text-sm font-bold">
                                        {data.allergies && (
                                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/30">
                                                <AlertTriangle size={18} />
                                                <span>الحساسية: {data.allergies}</span>
                                            </div>
                                        )}
                                        {data.chronic_diseases && (
                                            <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/30">
                                                <HeartPulse size={18} />
                                                <span>الأمراض المزمنة: {data.chronic_diseases}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Patient Header Card */}
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
                        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 opacity-90"></div>
                        <div className="p-8 relative z-10 pt-16">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                <div className="flex items-end gap-6">
                                    <div className="h-28 w-28 bg-white rounded-3xl flex items-center justify-center text-indigo-600 font-black text-4xl shadow-xl border-4 border-white shrink-0">
                                        {getInitials(student.name)}
                                    </div>
                                    <div className="mb-1">
                                        <h3 className="text-3xl font-black text-slate-900 mb-2">{student.name}</h3>
                                        <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
                                            <span className="bg-indigo-50 text-indigo-700 px-3.5 py-1.5 rounded-xl border border-indigo-100">{student.grade?.name} - {student.division?.name}</span>
                                            <span className="bg-slate-100 text-slate-700 px-3.5 py-1.5 rounded-xl font-mono">الهوية: {student.national_id}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex flex-wrap gap-3">
                                    <div className={classNames(
                                        'flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-sm border font-bold text-sm',
                                        data.consent_given ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-100 border-slate-200 text-slate-600'
                                    )}>
                                        <FileSignature size={20} />
                                        <span>{data.consent_given ? 'موافقة ولي الأمر متوفرة' : 'لا يوجد موافقة متوفرة'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Medical Form & Tabs */}
                    <form onSubmit={submit} className="bg-white rounded-3xl shadow-sm border border-slate-200">
                        <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50 rounded-t-3xl">
                            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                                <Stethoscope className="text-indigo-600" size={26} />
                                السجل الصحي المعتمد
                            </h3>
                            {!isEditing ? (
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(true)}
                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                                >
                                    <User size={16} />
                                    تعديل البيانات الطبية
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditing(false);
                                            setData({
                                                height: medicalRecord.height || '',
                                                weight: medicalRecord.weight || '',
                                                blood_type: medicalRecord.blood_type || '',
                                                allergies: medicalRecord.allergies || '',
                                                chronic_diseases: medicalRecord.chronic_diseases || '',
                                                regular_medications: medicalRecord.regular_medications || '',
                                                past_surgeries: medicalRecord.past_surgeries || '',
                                                consent_given: medicalRecord.consent_given || false,
                                            });
                                        }}
                                        className="px-5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-all"
                                    >
                                        إلغاء
                                    </button>
                                    <PrimaryButton disabled={processing} className="rounded-xl px-6 py-2.5 gap-2 shadow-md">
                                        <Save size={18} />
                                        حفظ التعديلات
                                    </PrimaryButton>
                                </div>
                            )}
                        </div>

                        <div className="p-6 sm:p-8">
                            <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
                                <Tab.List className="flex space-x-2 space-x-reverse rounded-2xl bg-slate-100 p-1.5 mb-8">
                                    <Tab
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2',
                                                selected
                                                    ? 'bg-white text-indigo-700 shadow-md font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            )
                                        }
                                    >
                                        <Activity size={18} /> المؤشرات الحيوية (Vitals)
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2',
                                                selected
                                                    ? 'bg-white text-indigo-700 shadow-md font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            )
                                        }
                                    >
                                        <FileText size={18} /> الحساسية والأمراض المزمنة
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2',
                                                selected
                                                    ? 'bg-white text-indigo-700 shadow-md font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            )
                                        }
                                    >
                                        <Pill size={18} /> الأدوية والعمليات
                                    </Tab>
                                    <Tab
                                        className={({ selected }) =>
                                            classNames(
                                                'w-full rounded-xl py-3.5 text-sm font-bold transition-all flex items-center justify-center gap-2',
                                                selected
                                                    ? 'bg-white text-indigo-700 shadow-md font-black'
                                                    : 'text-slate-600 hover:text-slate-900'
                                            )
                                        }
                                    >
                                        <FileSignature size={18} /> الإقرارات والموافقات
                                    </Tab>
                                </Tab.List>

                                <Tab.Panels className="mt-2">
                                    {/* 1. Vitals Tab */}
                                    <Tab.Panel className="focus:outline-none space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* Height Card */}
                                            <div className="p-6 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/40 to-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 mb-4 text-indigo-600">
                                                    <div className="p-3 bg-indigo-100 rounded-2xl"><Ruler size={26} /></div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800">الطول</h4>
                                                        <span className="text-xs text-slate-500 font-medium">بالسنتيمتر</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 disabled:bg-transparent disabled:border-transparent disabled:font-black disabled:text-4xl disabled:p-0 disabled:text-slate-900 transition-all font-bold text-lg"
                                                        value={data.height}
                                                        onChange={(e) => setData('height', e.target.value)}
                                                        disabled={!isEditing}
                                                        placeholder="140"
                                                    />
                                                    {isEditing && <span className="absolute left-4 top-3.5 text-slate-400 font-bold">سم</span>}
                                                    {!isEditing && data.height && <span className="text-slate-500 font-bold text-lg mr-2">سم</span>}
                                                </div>
                                                <InputError message={errors.height} className="mt-2" />
                                            </div>

                                            {/* Weight Card */}
                                            <div className="p-6 rounded-2xl border border-teal-100 bg-gradient-to-br from-teal-50/40 to-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 mb-4 text-teal-600">
                                                    <div className="p-3 bg-teal-100 rounded-2xl"><Weight size={26} /></div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800">الوزن</h4>
                                                        <span className="text-xs text-slate-500 font-medium">بالكيلوجرام</span>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        className="block w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-teal-500 disabled:bg-transparent disabled:border-transparent disabled:font-black disabled:text-4xl disabled:p-0 disabled:text-slate-900 transition-all font-bold text-lg"
                                                        value={data.weight}
                                                        onChange={(e) => setData('weight', e.target.value)}
                                                        disabled={!isEditing}
                                                        placeholder="45"
                                                    />
                                                    {isEditing && <span className="absolute left-4 top-3.5 text-slate-400 font-bold">كجم</span>}
                                                    {!isEditing && data.weight && <span className="text-slate-500 font-bold text-lg mr-2">كجم</span>}
                                                </div>
                                                <InputError message={errors.weight} className="mt-2" />
                                            </div>

                                            {/* Blood Type Card */}
                                            <div className="p-6 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white shadow-sm hover:shadow-md transition-all">
                                                <div className="flex items-center gap-3 mb-4 text-rose-600">
                                                    <div className="p-3 bg-rose-100 rounded-2xl"><Droplet size={26} /></div>
                                                    <div>
                                                        <h4 className="font-black text-slate-800">فصيلة الدم</h4>
                                                        <span className="text-xs text-slate-500 font-medium">نوع الزاوية الدموية</span>
                                                    </div>
                                                </div>
                                                {isEditing ? (
                                                    <select
                                                        className="block w-full border border-slate-200 bg-white py-3 rounded-xl focus:ring-2 focus:ring-rose-500 font-bold text-lg"
                                                        value={data.blood_type}
                                                        onChange={(e) => setData('blood_type', e.target.value)}
                                                    >
                                                        <option value="">غير محدد</option>
                                                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <div className="text-4xl font-black text-slate-900">{data.blood_type || '---'}</div>
                                                )}
                                                <InputError message={errors.blood_type} className="mt-2" />
                                            </div>
                                        </div>

                                        {/* Highlighted BMI Status Card */}
                                        {bmiInfo && (
                                            <div className={classNames(
                                                "p-6 rounded-3xl border-2 transition-all shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6",
                                                bmiInfo.badgeBg
                                            )}>
                                                <div className="flex items-center gap-4">
                                                    <div className={classNames("p-4 rounded-2xl shadow-sm shrink-0", bmiInfo.color)}>
                                                        <Activity size={32} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="text-xl font-black">مؤشر كتلة الجسم (BMI)</h4>
                                                            <span className={classNames("px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider", bmiInfo.color)}>
                                                                {bmiInfo.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-medium mt-1 opacity-90">{bmiInfo.text}</p>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-4xl font-black font-mono">{bmiInfo.val}</div>
                                                    <span className="text-xs font-bold opacity-75">kg/m²</span>
                                                </div>
                                            </div>
                                        )}
                                    </Tab.Panel>

                                    {/* 2. Medical History & Chronic Conditions */}
                                    <Tab.Panel className="focus:outline-none space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-red-100 bg-red-50/30">
                                                <InputLabel htmlFor="allergies" value="الحساسية المعروفة (أدوية، أطعمة، بيئية)" className="font-black text-slate-800 text-base mb-2 flex items-center gap-2 text-red-700" />
                                                <textarea
                                                    id="allergies"
                                                    className="mt-1 block w-full border-slate-200 focus:border-red-500 focus:ring-red-500 rounded-xl shadow-sm disabled:bg-white disabled:text-slate-800 disabled:border-slate-200 p-4 font-bold text-base"
                                                    rows="3"
                                                    value={data.allergies}
                                                    onChange={(e) => setData('allergies', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="أدخل أي نوع حساسية يعاني منها الطالب..."
                                                />
                                                <InputError message={errors.allergies} className="mt-2" />
                                            </div>

                                            <div className="col-span-1 md:col-span-2 p-6 rounded-2xl border border-amber-100 bg-amber-50/30">
                                                <InputLabel htmlFor="chronic_diseases" value="الأمراض المزمنة (ربو، سكري، ضغط، إلخ)" className="font-black text-slate-800 text-base mb-2 flex items-center gap-2 text-amber-800" />
                                                <textarea
                                                    id="chronic_diseases"
                                                    className="mt-1 block w-full border-slate-200 focus:border-amber-500 focus:ring-amber-500 rounded-xl shadow-sm disabled:bg-white disabled:text-slate-800 disabled:border-slate-200 p-4 font-bold text-base"
                                                    rows="3"
                                                    value={data.chronic_diseases}
                                                    onChange={(e) => setData('chronic_diseases', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="أدخل الأمراض المزمنة إن وجدت..."
                                                />
                                                <InputError message={errors.chronic_diseases} className="mt-2" />
                                            </div>
                                        </div>
                                    </Tab.Panel>

                                    {/* 3. Medications & Surgeries */}
                                    <Tab.Panel className="focus:outline-none space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                                                <InputLabel htmlFor="regular_medications" value="الأدوية المعتادة والمتكررة" className="font-black text-slate-800 text-base mb-2 flex items-center gap-2" />
                                                <textarea
                                                    id="regular_medications"
                                                    className="mt-1 block w-full border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm disabled:bg-white disabled:text-slate-800 disabled:border-slate-200 p-4 font-medium"
                                                    rows="4"
                                                    value={data.regular_medications}
                                                    onChange={(e) => setData('regular_medications', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="الأدوية الموصوفة للطالب بشكل دائم..."
                                                />
                                                <InputError message={errors.regular_medications} className="mt-2" />
                                            </div>

                                            <div className="p-6 rounded-2xl border border-slate-200 bg-slate-50/50">
                                                <InputLabel htmlFor="past_surgeries" value="العمليات الجراحية والعمليات السابقة" className="font-black text-slate-800 text-base mb-2 flex items-center gap-2" />
                                                <textarea
                                                    id="past_surgeries"
                                                    className="mt-1 block w-full border-slate-200 focus:border-indigo-500 focus:ring-indigo-500 rounded-xl shadow-sm disabled:bg-white disabled:text-slate-800 disabled:border-slate-200 p-4 font-medium"
                                                    rows="4"
                                                    value={data.past_surgeries}
                                                    onChange={(e) => setData('past_surgeries', e.target.value)}
                                                    disabled={!isEditing}
                                                    placeholder="تفاصيل أي عمليات جراحية خضع لها الطالب..."
                                                />
                                                <InputError message={errors.past_surgeries} className="mt-2" />
                                            </div>
                                        </div>
                                    </Tab.Panel>

                                    {/* 4. Consent & Clearances */}
                                    <Tab.Panel className="focus:outline-none">
                                        <label className={classNames(
                                            "flex items-start gap-5 p-8 border-2 rounded-3xl transition-all shadow-sm",
                                            isEditing ? "cursor-pointer hover:bg-slate-50" : "cursor-default",
                                            data.consent_given ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50"
                                        )}>
                                            <div className="flex h-6 items-center mt-1">
                                                <input
                                                    type="checkbox"
                                                    className="h-7 w-7 rounded-lg border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50 transition-all cursor-pointer"
                                                    checked={data.consent_given}
                                                    onChange={(e) => setData('consent_given', e.target.checked)}
                                                    disabled={!isEditing}
                                                />
                                            </div>
                                            <div>
                                                <span className={classNames("block text-xl font-black mb-1", data.consent_given ? "text-emerald-900" : "text-slate-800")}>
                                                    موافقة ولي الأمر الطبية المعتمدة
                                                </span>
                                                <span className="block text-slate-600 leading-relaxed font-medium">
                                                    إقرار وموافقة رسمية مسجلة من ولي الأمر تتيح لعيادة المدرسة تقديم الإسعافات الأولية الأساسية وإعطاء الخافض أو المسكن البسيط عند الحاجة أثناء تواجد الطالب في المدرسة.
                                                </span>
                                            </div>
                                        </label>
                                        <InputError message={errors.consent_given} className="mt-2" />
                                    </Tab.Panel>
                                </Tab.Panels>
                            </Tab.Group>
                        </div>
                    </form>
                </div>
        </AdminLayout>
    );
}

