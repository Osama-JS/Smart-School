import React, { useState, useEffect } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';

export default function PromotionsIndex({ academicYears, sections }) {
    const { errors, success, error } = usePage().props;

    // Source selection
    const [sourceYear, setSourceYear] = useState('');
    const [sourceSection, setSourceSection] = useState('');
    const [sourceGrade, setSourceGrade] = useState('');
    const [sourceDivision, setSourceDivision] = useState('');

    // Target selection
    const [targetYear, setTargetYear] = useState('');
    const [targetSection, setTargetSection] = useState('');
    const [targetGrade, setTargetGrade] = useState('');
    const [targetDivision, setTargetDivision] = useState('');

    // Students list
    const [students, setStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [isPromoting, setIsPromoting] = useState(false);

    // Helpers to get grades/divisions based on selection
    const getGrades = (sectionId) => {
        if (!sectionId) return [];
        const section = sections.find(s => s.id == sectionId);
        return section ? section.grades : [];
    };

    const getDivisions = (sectionId, gradeId) => {
        if (!gradeId) return [];
        const grades = getGrades(sectionId);
        const grade = grades.find(g => g.id == gradeId);
        return grade ? grade.divisions : [];
    };

    // Fetch students when source changes
    useEffect(() => {
        if (sourceYear && sourceDivision) {
            setIsLoadingStudents(true);
            axios.post(route('academic.promotions.students'), {
                academic_year_id: sourceYear,
                division_id: sourceDivision
            }).then(response => {
                setStudents(response.data);
                // By default select all
                setSelectedStudents(response.data.map(s => s.id));
                setIsLoadingStudents(false);
            }).catch(error => {
                console.error("Error fetching students", error);
                setIsLoadingStudents(false);
            });
        } else {
            setStudents([]);
            setSelectedStudents([]);
        }
    }, [sourceYear, sourceDivision]);

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedStudents(students.map(s => s.id));
        } else {
            setSelectedStudents([]);
        }
    };

    const handleSelectStudent = (id) => {
        if (selectedStudents.includes(id)) {
            setSelectedStudents(selectedStudents.filter(sid => sid !== id));
        } else {
            setSelectedStudents([...selectedStudents, id]);
        }
    };

    const submitPromotion = (e) => {
        e.preventDefault();

        if (selectedStudents.length === 0) {
            alert('الرجاء تحديد طالب واحد على الأقل للترقية.');
            return;
        }

        if (!targetYear || !targetDivision) {
            alert('الرجاء إكمال تحديد الوجهة (السنة والشعبة المستهدفة).');
            return;
        }

        if (sourceYear === targetYear) {
            alert('لا يمكن أن تكون سنة المصدر هي نفس سنة الوجهة.');
            return;
        }

        if (confirm(`هل أنت متأكد من ترفيع عدد ${selectedStudents.length} طالباً؟`)) {
            setIsPromoting(true);
            router.post(route('academic.promotions.promote'), {
                source_year_id: sourceYear,
                target_year_id: targetYear,
                target_division_id: targetDivision,
                enrollment_ids: selectedStudents
            }, {
                onFinish: () => setIsPromoting(false),
                preserveScroll: true,
                onSuccess: () => {
                    // Refresh student list
                    setSourceDivision('');
                    setTimeout(() => setSourceDivision(sourceDivision), 100);
                }
            });
        }
    };

    return (
        <MainLayout>
            <Head title="الترفيع الجماعي للطلاب" />

            <div className="p-6 bg-gray-50 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">الترفيع الجماعي للطلاب</h2>
                            <p className="text-gray-500 mt-1">نقل الطلاب الناجحين من سنة دراسية لعام جديد بضغطة زر</p>
                        </div>
                    </div>

                    {success && (
                        <div className="bg-green-100 border-r-4 border-green-500 text-green-700 p-4 rounded-lg shadow-sm flex items-center">
                            <span className="material-icons mr-2">check_circle</span>
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-100 border-r-4 border-red-500 text-red-700 p-4 rounded-lg shadow-sm flex items-center">
                            <span className="material-icons mr-2">error</span>
                            {error}
                        </div>
                    )}

                    <form onSubmit={submitPromotion} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        
                        {/* Source Selection Panel */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4 border-b pb-3">
                                <span className="material-icons text-blue-500">logout</span>
                                <h3 className="text-lg font-bold text-gray-800">من (المصدر)</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية الحالية</label>
                                    <select value={sourceYear} onChange={e => setSourceYear(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                        <option value="">-- اختر السنة --</option>
                                        {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة</label>
                                        <select value={sourceSection} onChange={e => {setSourceSection(e.target.value); setSourceGrade(''); setSourceDivision('');}} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الصف</label>
                                        <select value={sourceGrade} onChange={e => {setSourceGrade(e.target.value); setSourceDivision('');}} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {getGrades(sourceSection).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الشعبة</label>
                                        <select value={sourceDivision} onChange={e => setSourceDivision(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {getDivisions(sourceSection, sourceGrade).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Students List */}
                            {sourceDivision && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                                        <span>الطلاب في هذه الشعبة</span>
                                        {isLoadingStudents && <span className="text-xs text-blue-500 animate-pulse">جاري التحميل...</span>}
                                    </h4>
                                    
                                    <div className="border rounded-lg max-h-80 overflow-y-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-right">
                                                        <input 
                                                            type="checkbox" 
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                            checked={students.length > 0 && selectedStudents.length === students.length}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </th>
                                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">اسم الطالب</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {students.length === 0 && !isLoadingStudents && (
                                                    <tr>
                                                        <td colSpan="2" className="px-4 py-8 text-center text-gray-500 text-sm">
                                                            لا يوجد طلاب في هذه الشعبة لتلك السنة
                                                        </td>
                                                    </tr>
                                                )}
                                                {students.map(student => (
                                                    <tr key={student.id} className={selectedStudents.includes(student.id) ? 'bg-blue-50/30' : ''}>
                                                        <td className="px-4 py-3 w-12">
                                                            <input 
                                                                type="checkbox" 
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                checked={selectedStudents.includes(student.id)}
                                                                onChange={() => handleSelectStudent(student.id)}
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-800">
                                                            {student.student_name}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">محدد: {selectedStudents.length} من {students.length}</p>
                                </div>
                            )}
                        </div>

                        {/* Target Selection Panel */}
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-sm border border-blue-100 p-6 space-y-4">
                            <div className="flex items-center gap-2 mb-4 border-b border-blue-100 pb-3">
                                <span className="material-icons text-green-500">login</span>
                                <h3 className="text-lg font-bold text-gray-800">إلى (الوجهة)</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">السنة الدراسية الجديدة</label>
                                    <select value={targetYear} onChange={e => setTargetYear(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                        <option value="">-- اختر السنة --</option>
                                        {academicYears.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                                    </select>
                                </div>
                                
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">المرحلة</label>
                                        <select value={targetSection} onChange={e => {setTargetSection(e.target.value); setTargetGrade(''); setTargetDivision('');}} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الصف</label>
                                        <select value={targetGrade} onChange={e => {setTargetGrade(e.target.value); setTargetDivision('');}} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {getGrades(targetSection).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">الشعبة</label>
                                        <select value={targetDivision} onChange={e => setTargetDivision(e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500" required>
                                            <option value="">-- اختر --</option>
                                            {getDivisions(targetSection, targetGrade).map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-8 flex flex-col justify-center items-center">
                                <div className="bg-blue-100 p-4 rounded-full mb-4">
                                    <span className="material-icons text-blue-600 text-4xl">swap_vert</span>
                                </div>
                                <p className="text-center text-sm text-gray-600 mb-6 px-4">
                                    سيتم إغلاق سجل الطلاب في السنة القديمة (خريج) وإنشاء سجل جديد لهم في السنة والشعبة المحددة أعلاه بصفحة بيضاء للدرجات والغياب.
                                </p>
                                <button 
                                    type="submit" 
                                    disabled={isPromoting || selectedStudents.length === 0 || !targetDivision || !targetYear}
                                    className={`w-full py-3 px-4 rounded-xl flex justify-center items-center gap-2 text-white font-bold text-lg transition-all ${
                                        (isPromoting || selectedStudents.length === 0 || !targetDivision || !targetYear) 
                                        ? 'bg-gray-400 cursor-not-allowed' 
                                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                    }`}
                                >
                                    {isPromoting ? (
                                        <>
                                            <span className="material-icons animate-spin">refresh</span>
                                            جاري الترفيع...
                                        </>
                                    ) : (
                                        <>
                                            <span className="material-icons">rocket_launch</span>
                                            تنفيذ الترفيع الجماعي ({selectedStudents.length} طلاب)
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
