import React, { useState, useEffect } from 'react';
import { Head, router, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowRight, Save, User, Lock, Phone, Mail, MapPin, Eye, EyeOff, ShieldAlert, Users, Bus, GraduationCap, Building2, History, Plus, X } from 'lucide-react';
import SelectInput from '@/Components/SelectInput';
import Modal from '@/Components/Modal';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function StudentsEdit({ student, parents, academicYears, sections }) {
    // Determine initial academic enrollment values from current/latest enrollment
    const currEnroll = student.enrollments && student.enrollments.length > 0 
        ? student.enrollments[student.enrollments.length - 1] 
        : null;

    const initialParentId = student.parents && student.parents.length > 0 ? student.parents[0].id : '';
    const initialRelationship = student.parents && student.parents.length > 0 ? student.parents[0].pivot.relationship_type : 'أب';

    const { data, setData, put, processing, errors } = useForm({
        name: student.user.name || '',
        username: student.user.username || '',
        password: '',
        email: student.user.email || '',
        phone: student.user.phone || '',
        national_id: student.user.national_id || '',
        address: student.user.address || '',
        is_active: student.user.is_active === 1 || student.user.is_active === true,
        transport_subscription: student.transport_subscription === 1 || student.transport_subscription === true,
        
        parent_id: initialParentId,
        relationship_type: initialRelationship,
        
        division_id: currEnroll ? currEnroll.division_id : '',
        enrollment_status: currEnroll ? currEnroll.status : 'active',
    });

    const [showPassword, setShowPassword] = useState(false);

    // Quick Add Parent State
    const [parentsList, setParentsList] = useState(parents || []);
    const [isAddParentModalOpen, setIsAddParentModalOpen] = useState(false);
    const [parentForm, setParentForm] = useState({ name: '', username: '', password: '', phone: '', national_id: '' });
    const [parentFormErrors, setParentFormErrors] = useState({});
    const [isSubmittingParent, setIsSubmittingParent] = useState(false);
    const initialSectionId = currEnroll?.division?.grade?.section_id || '';
    const initialGradeId = currEnroll?.division?.grade_id || '';

    const [selectedSection, setSelectedSection] = useState(initialSectionId);
    const [selectedGrade, setSelectedGrade] = useState(initialGradeId);
    
    const [availableGrades, setAvailableGrades] = useState([]);
    const [availableDivisions, setAvailableDivisions] = useState([]);

    // Initialize cascading dropdowns on load
    useEffect(() => {
        if (selectedSection) {
            const section = sections.find(s => s.id == selectedSection);
            setAvailableGrades(section ? section.grades : []);
        }
    }, []);

    useEffect(() => {
        if (selectedGrade && availableGrades.length > 0) {
            const grade = availableGrades.find(g => g.id == selectedGrade);
            setAvailableDivisions(grade ? grade.divisions : []);
        }
    }, [availableGrades]);

    // Handle user changes to cascading dropdowns
    const handleSectionChange = (val) => {
        setSelectedSection(val);
        const section = sections.find(s => s.id == val);
        setAvailableGrades(section ? section.grades : []);
        setSelectedGrade('');
        setAvailableDivisions([]);
        setData('division_id', '');
    };

    const handleGradeChange = (val) => {
        setSelectedGrade(val);
        const grade = availableGrades.find(g => g.id == val);
        setAvailableDivisions(grade ? grade.divisions : []);
        setData('division_id', '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        put(route('academic.students.update', student.id));
    };

    const handleQuickAddParent = async (e) => {
        e.preventDefault();
        setIsSubmittingParent(true);
        setParentFormErrors({});
        
        try {
            const response = await axios.post(route('academic.parents.quick-store'), parentForm);
            if (response.data.success) {
                const newParent = response.data.parent;
                setParentsList([...parentsList, newParent]);
                setData('parent_id', newParent.id);
                setIsAddParentModalOpen(false);
                setParentForm({ name: '', username: '', password: '', phone: '', national_id: '' });
                Swal.fire({ title: 'نجاح', text: 'تمت إضافة ولي الأمر بنجاح', icon: 'success', confirmButtonText: 'حسناً' });
            }
        } catch (error) {
            if (error.response?.data?.errors) {
                setParentFormErrors(error.response.data.errors);
            } else {
                Swal.fire({ title: 'خطأ', text: 'حدث خطأ أثناء الإضافة', icon: 'error', confirmButtonText: 'حسناً' });
            }
        } finally {
            setIsSubmittingParent(false);
        }
    };

    return (
        <AdminLayout activeMenu="الطلاب">
            <Head title={`تعديل بيانات: ${student.user.name} | النظام الأكاديمي`} />

            <div className="max-w-5xl mx-auto animate-fade-in pb-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <Link href={route('academic.students')} className="w-10 h-10 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center text-slate-500 hover:text-indigo-600 hover:border-indigo-200 transition-all hover:shadow-sm">
                            <ArrowRight size={20} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white">تعديل ملف الطالب</h1>
                            <p className="text-sm text-slate-500 mt-1">تحديث سجلات الطالب: {student.user.name}</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Academic Enrollment Section */}
                    <div className="bg-gradient-to-br from-indigo-50/50 to-white dark:from-indigo-900/10 dark:to-slate-800/50 rounded-3xl border border-indigo-100 dark:border-indigo-500/20 shadow-sm overflow-hidden relative">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl" />
                        <div className="border-b border-indigo-100 dark:border-indigo-500/20 bg-indigo-50/50 dark:bg-indigo-900/20 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <GraduationCap className="text-indigo-600 dark:text-indigo-400" size={20} />
                                <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">سجل السنة الحالية (تعديل أو تسجيل بسنة جديدة)</h2>
                            </div>
                            
                            {/* Status Toggle */}
                            <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-slate-200 dark:border-slate-700 z-10">
                                <button type="button" onClick={() => setData('enrollment_status', 'active')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data.enrollment_status === 'active' ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                    نشط
                                </button>
                                <button type="button" onClick={() => setData('enrollment_status', 'transferred')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data.enrollment_status === 'transferred' ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                    منقول
                                </button>
                                <button type="button" onClick={() => setData('enrollment_status', 'withdrawn')}
                                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${data.enrollment_status === 'withdrawn' ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                    مسحوب
                                </button>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">القسم <span className="text-rose-500">*</span></label>
                                <SelectInput
                                    options={sections.map(s => ({ value: s.id, label: s.name }))}
                                    value={selectedSection}
                                    onChange={handleSectionChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الصف الدراسي <span className="text-rose-500">*</span></label>
                                <SelectInput
                                    options={availableGrades.map(g => ({ value: g.id, label: g.name }))}
                                    value={selectedGrade}
                                    onChange={handleGradeChange}
                                    disabled={!selectedSection}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الشعبة <span className="text-rose-500">*</span></label>
                                <SelectInput
                                    options={availableDivisions.map(d => ({ value: d.id, label: d.name }))}
                                    value={data.division_id}
                                    onChange={val => setData('division_id', val)}
                                    disabled={!selectedGrade}
                                />
                                {errors.division_id && <p className="text-xs text-rose-500 mt-1.5">{errors.division_id}</p>}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Student Account Data */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                                <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center gap-3">
                                    <User className="text-indigo-500" size={20} />
                                    <h2 className="text-lg font-bold text-dark-900 dark:text-white">بيانات الطالب ومعلومات الدخول</h2>
                                </div>
                                
                                <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Name */}
                                    <div className="col-span-full">
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم الرباعي للطالب <span className="text-rose-500">*</span></label>
                                        <input type="text"
                                            className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.name ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400'} rounded-2xl px-4 py-3 text-sm outline-none transition-all`}
                                            value={data.name} onChange={e => setData('name', e.target.value)} />
                                        {errors.name && <p className="text-xs text-rose-500 mt-1.5">{errors.name}</p>}
                                    </div>

                                    {/* Username */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم <span className="text-rose-500">*</span></label>
                                        <div className="relative">
                                            <User size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type="text"
                                                className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.username ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400'} rounded-2xl pr-11 pl-4 py-3 text-sm outline-none transition-all`}
                                                value={data.username} onChange={e => setData('username', e.target.value)} dir="ltr" />
                                        </div>
                                        {errors.username && <p className="text-xs text-rose-500 mt-1.5">{errors.username}</p>}
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">كلمة المرور الجديدة</label>
                                        <div className="relative">
                                            <Lock size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input type={showPassword ? "text" : "password"}
                                                className={`w-full bg-slate-50 dark:bg-slate-900 border ${errors.password ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 dark:border-slate-700 focus:border-indigo-400'} rounded-2xl pr-11 pl-12 py-3 text-sm outline-none transition-all`}
                                                value={data.password} onChange={e => setData('password', e.target.value)} dir="ltr" placeholder="أتركه فارغاً إذا لم ترد تغييره" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                        {errors.password && <p className="text-xs text-rose-500 mt-1.5">{errors.password}</p>}
                                    </div>

                                    {/* Phone & National ID */}
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الجوال (اختياري)</label>
                                        <input type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                                            value={data.phone} onChange={e => setData('phone', e.target.value)} dir="ltr" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهوية (اختياري)</label>
                                        <input type="text"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-2xl px-4 py-3 text-sm outline-none transition-all"
                                            value={data.national_id} onChange={e => setData('national_id', e.target.value)} dir="ltr" />
                                    </div>

                                    {/* Is Active Status */}
                                    <div className="col-span-full border border-slate-100 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${data.is_active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400' : 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400'}`}>
                                                <ShieldAlert size={20} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-slate-800 dark:text-white">حالة الدخول للحساب</h3>
                                                <p className="text-xs text-slate-500 mt-0.5">تفعيل أو تعطيل قدرة الطالب على الدخول للبوابة</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                                        </label>
                                    </div>

                                </div>
                            </div>
                        </div>

                        {/* Additional Info Sidebar */}
                        <div className="lg:col-span-1 space-y-6">
                            
                            {/* Parent Linking */}
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
                                        <Users size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">ارتباط ولي الأمر</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white">ولي الأمر</label>
                                            <button type="button" onClick={() => setIsAddParentModalOpen(true)} className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1">
                                                <Plus size={14} /> إضافة ولي أمر جديد
                                            </button>
                                        </div>
                                        <SelectInput
                                            options={parentsList.map(p => ({ value: p.id, label: p.name + (p.national_id ? ` (${p.national_id})` : '') }))}
                                            value={data.parent_id}
                                            onChange={val => setData('parent_id', val)}
                                            placeholder="اختر لإلغاء الربط أو التغيير"
                                            isSearchable={true}
                                        />
                                    </div>

                                    {data.parent_id && (
                                        <div>
                                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">صلة القرابة</label>
                                            <SelectInput
                                                options={[
                                                    { value: 'أب', label: 'أب' },
                                                    { value: 'أم', label: 'أم' },
                                                    { value: 'أخ', label: 'أخ' },
                                                    { value: 'أخرى', label: 'أخرى' },
                                                ]}
                                                value={data.relationship_type}
                                                onChange={val => setData('relationship_type', val)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Transport Services */}
                            <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden p-6">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center">
                                        <Bus size={20} />
                                    </div>
                                    <h3 className="font-bold text-slate-900 dark:text-white">النقل المدرسي</h3>
                                </div>
                                
                                <label className="flex items-start gap-4 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <div className="relative flex items-center mt-1">
                                        <input type="checkbox" className="peer w-5 h-5 border-2 border-slate-300 rounded text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900" 
                                            checked={data.transport_subscription} onChange={e => setData('transport_subscription', e.target.checked)} />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-slate-900 dark:text-white">مشترك في الحافلة</span>
                                        <span className="block text-xs text-slate-500 mt-1">تحديد الطالب ضمن قوائم النقل</span>
                                    </div>
                                </label>
                            </div>

                            <button type="submit" disabled={processing} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl text-sm font-bold shadow-xl shadow-indigo-500/30 transition-all hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed">
                                {processing ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <><Save size={20} /> حفظ التعديلات</>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Academic History Viewer (Read Only) */}
                    {student.enrollments && student.enrollments.length > 1 && (
                        <div className="bg-white dark:bg-[#121820]/60 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
                            <div className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-6 py-4 flex items-center gap-3">
                                <History className="text-slate-500" size={20} />
                                <h2 className="text-lg font-bold text-dark-900 dark:text-white">السجل الأكاديمي التاريخي</h2>
                            </div>
                            <div className="p-6">
                                <div className="space-y-3">
                                    {[...student.enrollments].reverse().map((enroll, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                                    {enroll.academic_year?.name.split(' ')[0] || 'Y'}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white">
                                                        {enroll.academic_year?.name}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        {enroll.division?.grade?.section?.name} / {enroll.division?.grade?.name} / {enroll.division?.name}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                                enroll.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                                enroll.status === 'transferred' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' :
                                                enroll.status === 'graduated' ? 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400' :
                                                'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400'
                                            }`}>
                                                {enroll.status === 'active' ? 'نشط' : enroll.status === 'transferred' ? 'منقول' : enroll.status === 'graduated' ? 'خريج' : 'مسحوب'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </form>
            </div>

            {/* Quick Add Parent Modal */}
            <Modal show={isAddParentModalOpen} onClose={() => setIsAddParentModalOpen(false)} maxWidth="md">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">إضافة ولي أمر جديد</h3>
                        <button type="button" onClick={() => setIsAddParentModalOpen(false)} className="text-slate-400 hover:text-slate-500">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <form onSubmit={handleQuickAddParent} className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">الاسم <span className="text-rose-500">*</span></label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
                                value={parentForm.name} onChange={e => setParentForm({...parentForm, name: e.target.value})} required />
                            {parentFormErrors.name && <p className="text-xs text-rose-500 mt-1">{parentFormErrors.name[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">اسم المستخدم للدخول <span className="text-rose-500">*</span></label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
                                value={parentForm.username} onChange={e => setParentForm({...parentForm, username: e.target.value})} dir="ltr" required />
                            {parentFormErrors.username && <p className="text-xs text-rose-500 mt-1">{parentFormErrors.username[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">كلمة المرور <span className="text-rose-500">*</span></label>
                            <input type="password" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
                                value={parentForm.password} onChange={e => setParentForm({...parentForm, password: e.target.value})} dir="ltr" required />
                            {parentFormErrors.password && <p className="text-xs text-rose-500 mt-1">{parentFormErrors.password[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الهوية</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
                                value={parentForm.national_id} onChange={e => setParentForm({...parentForm, national_id: e.target.value})} dir="ltr" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-dark-900 dark:text-white mb-2">رقم الجوال</label>
                            <input type="text" className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 rounded-xl px-4 py-2.5 text-sm outline-none"
                                value={parentForm.phone} onChange={e => setParentForm({...parentForm, phone: e.target.value})} dir="ltr" />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsAddParentModalOpen(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 rounded-xl transition-colors">
                                إلغاء
                            </button>
                            <button type="submit" disabled={isSubmittingParent} className="px-5 py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-70 flex items-center gap-2">
                                {isSubmittingParent ? 'جاري الحفظ...' : 'حفظ وإضافة'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </AdminLayout>
    );
}
