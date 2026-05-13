import React, { useState, useEffect } from 'react';
import AdminLayout from '../../Layouts/AdminLayout';
import { Head, useForm, usePage } from '@inertiajs/react';
import { ImagePlus, Info, Users, ChevronDown, Plus, Trash2 } from 'lucide-react';

export default function EditUser({ grades, user, userSections }) {
    const { flash } = usePage().props;
    
    // Convert userSections into classRows structure
    const initialRows = userSections && userSections.length > 0 
        ? userSections.map((sectionId, i) => {
            let matchedGradeId = '';
            for (const grade of grades) {
                if (grade.sections.some(s => s.id === sectionId)) {
                    matchedGradeId = grade.id;
                    break;
                }
            }
            return { id: Date.now() + i, grade_id: matchedGradeId, section_id: sectionId };
        })
        : [{ id: Date.now(), grade_id: '', section_id: '' }];

    // Manage dynamic rows of grade/section
    const [classRows, setClassRows] = useState(initialRows);

    const { data, setData, put, processing, errors, clearErrors } = useForm({
        type: user.type || 'supervisor',
        name: user.name || '',
        phone: user.phone || '',
        gender: user.gender || '',
        username: user.username || '',
        password: '',
        sections: userSections || []
    });

    // Update form data sections whenever classRows change
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
                // If grade changes, reset the section
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
        put(route('users.update', user.id));
    };

    return (
        <AdminLayout activeMenu="المستخدمون">
            <Head title="تعديل مستخدم" />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-gray-800">المستخدمون / <span className="text-gray-500 text-lg">تعديل مستخدم</span></h2>
                </div>
                <div className="flex gap-2">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2 text-sm hover:bg-blue-600 transition-colors">
                        <Users size={16} />
                        مستخدموا لوحة التحكم
                    </button>
                </div>
            </div>

            {flash?.success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <span className="block sm:inline">{flash.success}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm border border-gray-100 p-6 relative">
                <div className="flex justify-end items-center mb-6">

                    <div className="w-64">
                        <div className="relative">
                            <select 
                                value={data.type}
                                onChange={e => {
                                    setData('type', e.target.value);
                                    clearErrors('type');
                                }}
                                className={`w-full bg-gray-50 border ${errors.type ? 'border-red-500' : 'border-gray-200'} text-gray-700 py-2 px-3 rounded-md appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-right pr-8`}
                            >
                                <option value="admin">مدير</option>
                                <option value="supervisor">المشرفين</option>
                                <option value="teacher">المعلمين</option>
                                <option value="student">الطلاب</option>
                            </select>
                            <ChevronDown className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" size={16} />
                        </div>
                        {errors.type && <p className="text-red-500 text-xs mt-1">{errors.type}</p>}
                    </div>
                </div>

                <div className="bg-[#f8f9fa] rounded-lg p-6 border border-gray-100 mb-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                        
                        <div className="flex-1 space-y-4">
                            {/* Row 1 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="الاسم الرباعي" 
                                        value={data.name}
                                        onChange={e => { setData('name', e.target.value); clearErrors('name'); }}
                                        autoComplete="name"
                                        className={`w-full border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-md py-2.5 px-3 focus:outline-none focus:border-blue-500 text-right bg-white`}
                                    />
                                    {errors.name && <p className="text-red-500 text-xs mt-1 absolute">{errors.name}</p>}
                                </div>
                                <div className="flex gap-4">
                                    <div className="relative w-1/3">
                                        <select 
                                            value={data.gender}
                                            onChange={e => { setData('gender', e.target.value); clearErrors('gender'); }}
                                            className={`w-full border ${errors.gender ? 'border-red-500' : 'border-gray-200'} rounded-md py-2.5 px-3 appearance-none focus:outline-none focus:border-blue-500 text-right bg-white`}
                                        >
                                            <option value="">النوع</option>
                                            <option value="male">ذكر</option>
                                            <option value="female">أنثى</option>
                                        </select>
                                        <ChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16} />
                                        {errors.gender && <p className="text-red-500 text-xs mt-1 absolute">{errors.gender}</p>}
                                    </div>
                                    <div className="relative w-2/3">
                                        <input 
                                            type="text" 
                                            placeholder="رقم الهاتف" 
                                            value={data.phone}
                                            onChange={e => { setData('phone', e.target.value); clearErrors('phone'); }}
                                            autoComplete="tel"
                                            className={`w-full border ${errors.phone ? 'border-red-500' : 'border-gray-200'} rounded-md py-2.5 px-3 focus:outline-none focus:border-blue-500 text-right bg-white`}
                                        />
                                        {errors.phone && <p className="text-red-500 text-xs mt-1 absolute">{errors.phone}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* Row 2: Dynamic Grade/Section rows */}
                            <div className="space-y-4">
                                {classRows.map((row, index) => (
                                    <div key={row.id} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="relative">
                                            <select 
                                                value={row.grade_id}
                                                onChange={(e) => handleRowChange(row.id, 'grade_id', e.target.value)}
                                                className="w-full border border-gray-200 rounded-md py-2.5 px-3 appearance-none focus:outline-none focus:border-blue-500 text-right bg-white"
                                            >
                                                <option value="">اختر الصف</option>
                                                {grades && grades.map(grade => (
                                                    <option key={grade.id} value={grade.id}>{grade.name}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16} />
                                        </div>
                                        
                                        <div className="flex gap-4 items-center">
                                            <div className="relative w-2/3">
                                                <select 
                                                    value={row.section_id}
                                                    onChange={(e) => handleRowChange(row.id, 'section_id', e.target.value)}
                                                    className="w-full border border-gray-200 rounded-md py-2.5 px-3 appearance-none focus:outline-none focus:border-blue-500 text-right bg-white"
                                                >
                                                    <option value="">اختر الشعبة</option>
                                                    {grades && row.grade_id && grades.find(g => g.id.toString() === row.grade_id.toString())?.sections.map(section => (
                                                        <option key={section.id} value={section.id}>{section.name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute left-3 top-3 text-gray-400 pointer-events-none" size={16} />
                                            </div>
                                            
                                            <div className="w-1/3 flex gap-2">
                                                {index === classRows.length - 1 ? (
                                                    <button 
                                                        type="button"
                                                        onClick={handleAddRow}
                                                        className="w-full border border-dashed border-gray-400 text-gray-500 rounded-md py-2 flex items-center justify-center gap-1 hover:bg-gray-50 hover:border-gray-500 transition-colors bg-white"
                                                    >
                                                        <span className="text-xs">إضافة صف</span>
                                                        <Plus size={14} />
                                                    </button>
                                                ) : (
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleRemoveRow(row.id)}
                                                        className="w-full border border-red-200 text-red-500 rounded-md py-2 flex items-center justify-center gap-1 hover:bg-red-50 hover:border-red-300 transition-colors bg-white"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Row 3 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-2 border-t border-gray-200">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="اسم المستخدم" 
                                        value={data.username}
                                        onChange={e => { setData('username', e.target.value); clearErrors('username'); }}
                                        autoComplete="username"
                                        className={`w-full border ${errors.username ? 'border-red-500' : 'border-gray-200'} rounded-md py-2.5 px-3 focus:outline-none focus:border-blue-500 text-right bg-white`}
                                    />
                                    {errors.username && <p className="text-red-500 text-xs mt-1 absolute">{errors.username}</p>}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="password" 
                                        placeholder="كلمة المرور (اتركها فارغة إذا لم ترد تغييرها)" 
                                        value={data.password}
                                        onChange={e => { setData('password', e.target.value); clearErrors('password'); }}
                                        autoComplete="new-password"
                                        className={`w-full border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-md py-2.5 px-3 focus:outline-none focus:border-blue-500 text-right bg-white`}
                                    />
                                    {errors.password && <p className="text-red-500 text-xs mt-1 absolute">{errors.password}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Box */}
                        <div className="w-full lg:w-48 xl:w-56">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg h-full min-h-[160px] bg-white flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                                <ImagePlus size={32} className="mb-2 text-gray-400" />
                                <span className="text-sm font-medium">اضف صورة</span>
                            </div>
                        </div>

                    </div>
                    
                    {/* Info text */}
                    <div className="flex items-center justify-center gap-2 mt-6 text-sm text-[#2a87a9]">
                        <p>هذا المستخدم خاص بتطبيق الجوال ، ولا يمكن الدخول من لوحة التحكم بنفس هذا الحساب</p>
                        <Info size={16} />
                    </div>

                    {/* Submit Button */}
                    <div className="mt-6">
                        <button 
                            type="submit"
                            disabled={processing}
                            className="w-full bg-[#3f8fca] hover:bg-[#347bae] disabled:bg-blue-300 text-white font-medium py-3 rounded-md transition-colors text-lg"
                        >
                            {processing ? 'جاري الحفظ...' : 'حفظ'}
                        </button>
                    </div>

                </div>
            </form>
        </AdminLayout>
    );
}
