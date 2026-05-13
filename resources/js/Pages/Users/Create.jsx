import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { 
    ImagePlus, Info, Users, ChevronDown, Plus, Trash2, 
    Save, UserPlus, ArrowRight, CheckCircle2
} from 'lucide-react';

export default function CreateUser({ grades }) {
    const { flash } = usePage().props;
    const [stayOnPage, setStayOnPage] = useState(false);
    const [classRows, setClassRows] = useState([{ id: Date.now(), grade_id: '', section_id: '' }]);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        type: 'supervisor',
        name: '',
        phone: '',
        gender: '',
        username: '',
        password: '',
        sections: []
    });

    useEffect(() => {
        const selectedSections = classRows
            .map(row => row.section_id)
            .filter(id => id !== '');
        setData('sections', selectedSections);
    }, [classRows]);

    const handleAddRow = () => {
        setClassRows([...classRows, { id: Date.now(), grade_id: '', section_id: '' }]);
    };

    const handleRemoveRow = (id) => {
        setClassRows(classRows.filter(row => row.id !== id));
    };

    const handleRowChange = (id, field, value) => {
        setClassRows(classRows.map(row => {
            if (row.id === id) {
                if (field === 'grade_id') {
                    return { ...row, grade_id: value, section_id: '' };
                }
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('users.store'), {
            onSuccess: () => {
                if (!stayOnPage) {
                    reset();
                    setClassRows([{ id: Date.now(), grade_id: '', section_id: '' }]);
                }
            }
        });
    };

    const userTypes = [
        { value: 'supervisor', label: 'مشرف', icon: '🛡️' },
        { value: 'teacher', label: 'معلم', icon: '👨‍🏫' },
        { value: 'student', label: 'طالب', icon: '🎓' },
    ];

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="إضافة مستخدم" />

            <div className="space-y-5">
                {/* Page Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#f0f7eb] flex items-center justify-center">
                            <UserPlus size={20} className="text-[#558a2a]" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">إضافة مستخدم جديد</h1>
                            <p className="text-sm text-slate-500">أدخل بيانات المستخدم لإنشاء حساب في النظام</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => window.history.back()}
                            className="erp-btn erp-btn-secondary"
                        >
                            <ArrowRight size={16} />
                            <span>رجوع</span>
                        </button>
                    </div>
                </div>

                {/* Success Message */}
                {flash?.success && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-xl animate-slide-up">
                        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
                        <span className="font-medium">{flash.success}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                        {/* Main Form */}
                        <div className="lg:col-span-2 space-y-5">
                            {/* User Type Selection */}
                            <div className="erp-card">
                                <div className="erp-card-header">
                                    <h3 className="font-bold text-slate-800 text-sm">نوع المستخدم</h3>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="w-4 h-4 rounded border-slate-300 text-[#6b9b37] focus:ring-[#6b9b37] focus:ring-offset-0"
                                            checked={stayOnPage}
                                            onChange={(e) => setStayOnPage(e.target.checked)}
                                        />
                                        <span className="text-xs text-slate-500">البقاء بعد الحفظ</span>
                                    </label>
                                </div>
                                <div className="erp-card-body">
                                    <div className="grid grid-cols-3 gap-3">
                                        {userTypes.map((type) => (
                                            <button
                                                key={type.value}
                                                type="button"
                                                onClick={() => { setData('type', type.value); clearErrors('type'); }}
                                                className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                                                    data.type === type.value
                                                        ? 'border-[#6b9b37] bg-[#f0f7eb] text-[#437020] shadow-sm shadow-green-100'
                                                        : 'border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50'
                                                }`}
                                            >
                                                <span className="text-lg">{type.icon}</span>
                                                <span>{type.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                    {errors.type && <p className="text-red-500 text-xs mt-2">{errors.type}</p>}
                                </div>
                            </div>

                            {/* Personal Info */}
                            <div className="erp-card">
                                <div className="erp-card-header">
                                    <h3 className="font-bold text-slate-800 text-sm">البيانات الشخصية</h3>
                                </div>
                                <div className="erp-card-body space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Name */}
                                        <div>
                                            <label className="erp-label">الاسم الرباعي</label>
                                            <input
                                                type="text"
                                                placeholder="أدخل الاسم الرباعي"
                                                value={data.name}
                                                onChange={e => { setData('name', e.target.value); clearErrors('name'); }}
                                                autoComplete="name"
                                                className={`erp-input ${errors.name ? 'error' : ''}`}
                                            />
                                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                                        </div>
                                        
                                        {/* Phone */}
                                        <div>
                                            <label className="erp-label">رقم الهاتف</label>
                                            <input
                                                type="text"
                                                placeholder="أدخل رقم الهاتف"
                                                value={data.phone}
                                                onChange={e => { setData('phone', e.target.value); clearErrors('phone'); }}
                                                autoComplete="tel"
                                                className={`erp-input ${errors.phone ? 'error' : ''}`}
                                            />
                                            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                                        </div>
                                    </div>

                                    {/* Gender */}
                                    <div className="w-full md:w-1/2">
                                        <label className="erp-label">الجنس</label>
                                        <div className="relative">
                                            <select
                                                value={data.gender}
                                                onChange={e => { setData('gender', e.target.value); clearErrors('gender'); }}
                                                className={`erp-select ${errors.gender ? 'error' : ''}`}
                                            >
                                                <option value="">اختر الجنس</option>
                                                <option value="male">ذكر</option>
                                                <option value="female">أنثى</option>
                                            </select>
                                            <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        </div>
                                        {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Academic Assignment */}
                            <div className="erp-card">
                                <div className="erp-card-header">
                                    <h3 className="font-bold text-slate-800 text-sm">التوزيع الأكاديمي</h3>
                                </div>
                                <div className="erp-card-body space-y-3">
                                    {classRows.map((row, index) => (
                                        <div key={row.id} className="flex items-end gap-3 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
                                            {/* Grade */}
                                            <div className="flex-1">
                                                {index === 0 && <label className="erp-label">الصف</label>}
                                                <div className="relative">
                                                    <select
                                                        value={row.grade_id}
                                                        onChange={(e) => handleRowChange(row.id, 'grade_id', e.target.value)}
                                                        className="erp-select"
                                                    >
                                                        <option value="">اختر الصف</option>
                                                        {grades && grades.map(grade => (
                                                            <option key={grade.id} value={grade.id}>{grade.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>

                                            {/* Section */}
                                            <div className="flex-1">
                                                {index === 0 && <label className="erp-label">الشعبة</label>}
                                                <div className="relative">
                                                    <select
                                                        value={row.section_id}
                                                        onChange={(e) => handleRowChange(row.id, 'section_id', e.target.value)}
                                                        className="erp-select"
                                                    >
                                                        <option value="">اختر الشعبة</option>
                                                        {grades && row.grade_id && grades.find(g => g.id.toString() === row.grade_id.toString())?.divisions?.map(division => (
                                                            <option key={division.id} value={division.id}>{division.name}</option>
                                                        ))}
                                                    </select>
                                                    <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>

                                            {/* Add/Remove */}
                                            <div className="shrink-0">
                                                {index === classRows.length - 1 ? (
                                                    <button
                                                        type="button"
                                                        onClick={handleAddRow}
                                                        className="erp-action-btn edit !w-[42px] !h-[42px]"
                                                    >
                                                        <Plus size={18} />
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveRow(row.id)}
                                                        className="erp-action-btn delete !w-[42px] !h-[42px]"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Login Credentials */}
                            <div className="erp-card">
                                <div className="erp-card-header">
                                    <h3 className="font-bold text-slate-800 text-sm">بيانات الدخول</h3>
                                </div>
                                <div className="erp-card-body">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="erp-label">اسم المستخدم</label>
                                            <input
                                                type="text"
                                                placeholder="أدخل اسم المستخدم"
                                                value={data.username}
                                                onChange={e => { setData('username', e.target.value); clearErrors('username'); }}
                                                autoComplete="username"
                                                className={`erp-input ${errors.username ? 'error' : ''}`}
                                                dir="ltr"
                                                style={{ textAlign: 'right' }}
                                            />
                                            {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
                                        </div>
                                        <div>
                                            <label className="erp-label">كلمة المرور</label>
                                            <input
                                                type="password"
                                                placeholder="أدخل كلمة المرور"
                                                value={data.password}
                                                onChange={e => { setData('password', e.target.value); clearErrors('password'); }}
                                                autoComplete="new-password"
                                                className={`erp-input ${errors.password ? 'error' : ''}`}
                                                dir="ltr"
                                                style={{ textAlign: 'right' }}
                                            />
                                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                                        </div>
                                    </div>
                                    
                                    {/* Info text */}
                                    <div className="flex items-center gap-2 mt-4 px-4 py-3 bg-[#f0f7eb] border border-[#dcefd1] rounded-lg">
                                        <Info size={16} className="text-[#6b9b37] shrink-0" />
                                        <p className="text-xs text-[#325518] font-medium">
                                            هذا المستخدم خاص بتطبيق الجوال، ولا يمكن الدخول من لوحة التحكم بنفس هذا الحساب
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-5">
                            {/* Avatar Upload */}
                            <div className="erp-card">
                                <div className="erp-card-header">
                                    <h3 className="font-bold text-slate-800 text-sm">الصورة الشخصية</h3>
                                </div>
                                <div className="erp-card-body">
                                    <div className="border-2 border-dashed border-slate-200 rounded-xl h-48 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-50 hover:border-[#96cf75] transition-all group">
                                        <div className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-3 group-hover:bg-[#f0f7eb] transition-colors">
                                            <ImagePlus size={24} className="text-slate-400 group-hover:text-[#6b9b37] transition-colors" />
                                        </div>
                                        <span className="text-sm font-medium group-hover:text-[#6b9b37] transition-colors">إضافة صورة</span>
                                        <span className="text-xs text-slate-300 mt-1">PNG, JPG — حتى 2MB</span>
                                    </div>
                                </div>
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="erp-btn erp-btn-primary w-full !py-3.5 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? (
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                ) : (
                                    <>
                                        <Save size={18} />
                                        <span>حفظ المستخدم</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
