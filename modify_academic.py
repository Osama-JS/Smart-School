import re

filepath = r"c:\xampp\htdocs\Smart-School\resources\js\Pages\Academic\ClassroomVisits\Index.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Add new imports
new_imports = """import FlatpickrInput from '@/Components/FlatpickrInput';
import SelectInput from '@/Components/SelectInput';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
"""
content = re.sub(r"(import \{ Toaster, toast \} from 'react-hot-toast';)", r"\1\n" + new_imports, content)

# Remove old Modal import
content = re.sub(r"import Modal from '@\/Components\/Modal';\n", "", content)

# Replace the `<Modal isOpen={` or whatever it is now (wait, earlier I set it to `show={`!)
content = content.replace("show={isCreateModalOpen}", "isOpen={isCreateModalOpen}")
content = content.replace("show={signaturePadOpen}", "isOpen={signaturePadOpen}")
content = content.replace("show={isPreviewModalOpen}", "isOpen={isPreviewModalOpen}")

# Add inline Modal
modal_def = """// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-fade-in" onClick={onClose} />
            <div className={`relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl rounded-3xl shadow-2xl w-full ${maxWidth} z-10 overflow-hidden border border-white/20 dark:border-slate-800/80 animate-scale-in flex flex-col`}>
                {title && (
                    <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="text-lg font-bold text-slate-850 dark:text-white flex items-center gap-2">{title}</h3>
                        <button type="button" onClick={onClose} className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"><X size={20}/></button>
                    </div>
                )}
                <div className="p-0 overflow-y-auto max-h-[75vh]">
                    {children}
                </div>
            </div>
        </div>
    );
}

"""
content = re.sub(r"// ─── Pagination Component ───", modal_def + r"// ─── Pagination Component ───", content)

# Change maxWidth props to Tailwind classes for the new inline Modal
content = content.replace('maxWidth="2xl"', 'maxWidth="max-w-2xl"')
content = content.replace('maxWidth="3xl"', 'maxWidth="max-w-3xl"')
content = content.replace('maxWidth="lg"', 'maxWidth="max-w-lg"')

# Update Modal titles to use the new prop instead of rendering headers manually
# Create Modal:
content = content.replace(
    """<Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="max-w-2xl">
                <form onSubmit={submit} className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            {selectedVisit ? <Edit size={20} className="text-primary-500" /> : <Plus size={20} className="text-primary-500" />}
                            {selectedVisit ? 'تعديل الزيارة الصفية' : 'إضافة زيارة صفية جديدة'}
                        </h2>
                        <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="p-6 space-y-5">""",
    """<Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} maxWidth="max-w-2xl" title={selectedVisit ? 'تعديل الزيارة الصفية' : 'إضافة زيارة صفية جديدة'}>
                <form onSubmit={submit} className="flex flex-col">
                    <div className="p-6 space-y-5">"""
)

# Signature Modal:
content = content.replace(
    """<Modal isOpen={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="max-w-lg">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">توقيع المشرف</h3>
                        <button onClick={() => setSignaturePadOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">""",
    """<Modal isOpen={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="max-w-lg" title="توقيع المشرف">
                <div className="p-6 space-y-4">"""
)

# Preview Modal:
content = content.replace(
    """<Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="max-w-3xl">
                {selectedVisit && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20">
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FileText size={20} className="text-primary-500" />
                                تفاصيل الزيارة الصفية
                            </h2>
                            <button onClick={() => setIsPreviewModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">""",
    """<Modal isOpen={isPreviewModalOpen} onClose={() => setIsPreviewModalOpen(false)} maxWidth="max-w-3xl" title="تفاصيل الزيارة الصفية">
                {selectedVisit && (
                    <div className="p-6 space-y-6">"""
)

# Replace inputs with FlatpickrInput and SelectInput and ReactQuill
# Filter Teacher Select:
content = content.replace(
    """<select
                                    value={filterData.teacher_id}
                                    onChange={e => setFilterData({...filterData, teacher_id: e.target.value})}
                                    className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold"
                                >
                                    <option value="">الكل</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>""",
    """<SelectInput
                                    value={filterData.teacher_id}
                                    onChange={(val) => setFilterData({...filterData, teacher_id: val})}
                                    options={teachers.map(t => ({ value: t.id, label: t.name }))}
                                    placeholder="الكل"
                                    isClearable={true}
                                />"""
)

# Filter Grade Select:
content = content.replace(
    """<select
                                    value={filterData.grade_id}
                                    onChange={e => setFilterData({...filterData, grade_id: e.target.value})}
                                    className="w-full bg-slate-50/50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 px-4 text-sm focus:ring-4 focus:ring-primary-500/10 focus:border-primary-400 outline-none transition-all dark:text-white font-semibold"
                                >
                                    <option value="">الكل</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>""",
    """<SelectInput
                                    value={filterData.grade_id}
                                    onChange={(val) => setFilterData({...filterData, grade_id: val})}
                                    options={grades.map(g => ({ value: g.id, label: g.name }))}
                                    placeholder="الكل"
                                    isClearable={true}
                                />"""
)

# Create Date Input:
content = content.replace(
    """<input
                                type="date"
                                value={data.visit_date}
                                onChange={e => setData('visit_date', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                                required
                            />""",
    """<FlatpickrInput
                                value={data.visit_date}
                                onChange={dateStr => setData('visit_date', dateStr)}
                                placeholder="تاريخ الزيارة"
                                required
                            />"""
)

# Create Visit Type Select:
content = content.replace(
    """<select
                                value={data.visit_type}
                                onChange={e => setData('visit_type', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                                required
                            >
                                <option value="توجيهية">توجيهية</option>
                                <option value="نموذجية">نموذجية</option>
                            </select>""",
    """<SelectInput
                                value={data.visit_type}
                                onChange={val => setData('visit_type', val)}
                                options={[{value: 'توجيهية', label: 'توجيهية'}, {value: 'نموذجية', label: 'نموذجية'}]}
                                placeholder="نوع الزيارة"
                                required
                            />"""
)

# Create Teacher Select:
content = content.replace(
    """<select
                            value={data.teacher_id}
                            onChange={e => setData('teacher_id', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                            required
                        >
                            <option value="">-- اختر المعلم --</option>
                            {teachers.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                        </select>""",
    """<SelectInput
                            value={data.teacher_id}
                            onChange={val => setData('teacher_id', val)}
                            options={teachers.map(t => ({ value: t.id, label: t.name }))}
                            placeholder="-- اختر المعلم --"
                            required
                        />"""
)

# Create Grade Select:
content = content.replace(
    """<select
                                value={data.grade_id}
                                onChange={e => {
                                    setData('grade_id', e.target.value);
                                    setData('division_id', '');
                                }}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                                required
                            >
                                <option value="">-- اختر الصف --</option>
                                {grades.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>""",
    """<SelectInput
                                value={data.grade_id}
                                onChange={val => {
                                    setData('grade_id', val);
                                    setData('division_id', '');
                                }}
                                options={grades.map(g => ({ value: g.id, label: g.name }))}
                                placeholder="-- اختر الصف --"
                                required
                            />"""
)

# Create Division Select:
content = content.replace(
    """<select
                                value={data.division_id}
                                onChange={e => setData('division_id', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                                required
                                disabled={!data.grade_id}
                            >
                                <option value="">-- اختر الشعبة --</option>
                                {availableDivisions.map(d => (
                                    <option key={d.id} value={d.id}>{d.name}</option>
                                ))}
                            </select>""",
    """<SelectInput
                                value={data.division_id}
                                onChange={val => setData('division_id', val)}
                                options={availableDivisions.map(d => ({ value: d.id, label: d.name }))}
                                placeholder="-- اختر الشعبة --"
                                required
                                disabled={!data.grade_id}
                            />"""
)

# Create Textareas (ReactQuill):
content = content.replace(
    """<textarea
                            value={data.discussed_points}
                            onChange={e => setData('discussed_points', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                            rows="3"
                            placeholder="أدخل النقاط..."
                        ></textarea>""",
    """<div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[120px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-slate-800 dark:[&_.ql-picker-options]:border-slate-700">
                            <ReactQuill 
                                theme="snow"
                                value={data.discussed_points}
                                onChange={content => setData('discussed_points', content)}
                                placeholder="أدخل النقاط..."
                            />
                        </div>"""
)

content = content.replace(
    """<textarea
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-colors dark:text-white"
                            rows="3"
                            placeholder="ملاحظات وتوصيات المشرف..."
                        ></textarea>""",
    """<div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden [&_.ql-toolbar]:border-none [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-slate-200 dark:[&_.ql-toolbar]:border-slate-700 [&_.ql-toolbar]:bg-slate-50 dark:[&_.ql-toolbar]:bg-slate-800/50 [&_.ql-container]:border-none [&_.ql-container]:text-sm [&_.ql-editor]:min-h-[120px] dark:[&_.ql-editor]:text-white dark:[&_.ql-picker]:text-slate-300 dark:[&_.ql-stroke]:stroke-slate-300 dark:[&_.ql-fill]:fill-slate-300 dark:[&_.ql-picker-options]:bg-slate-800 dark:[&_.ql-picker-options]:border-slate-700">
                            <ReactQuill 
                                theme="snow"
                                value={data.notes}
                                onChange={content => setData('notes', content)}
                                placeholder="ملاحظات وتوصيات المشرف..."
                            />
                        </div>"""
)

# Update Preview to display HTML:
content = content.replace(
    """{selectedVisit.discussed_points || <span className="text-slate-400 italic">لا يوجد</span>}""",
    """{selectedVisit.discussed_points ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.discussed_points }} /> : <span className="text-slate-400 italic">لا يوجد</span>}"""
)

content = content.replace(
    """{selectedVisit.notes || <span className="text-slate-400 italic">لا يوجد</span>}""",
    """{selectedVisit.notes ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.notes }} /> : <span className="text-slate-400 italic">لا يوجد</span>}"""
)


with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
