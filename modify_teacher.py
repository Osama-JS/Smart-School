import re

filepath = r"c:\xampp\htdocs\Smart-School\resources\js\Pages\Teacher\ClassroomVisits\Index.jsx"
with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# Remove old Modal import
content = re.sub(r"import Modal from '@\/Components\/Modal';\n", "", content)

# Replace the `<Modal show={`
content = content.replace("show={signaturePadOpen}", "isOpen={signaturePadOpen}")
content = content.replace("show={isPreviewModalOpen}", "isOpen={isPreviewModalOpen}")

# Add inline Modal
modal_def = """// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ isOpen, onClose, title, children, maxWidth = 'max-w-lg' }) {
    React.useEffect(() => {
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

# Signature Modal:
content = content.replace(
    """<Modal isOpen={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="max-w-lg">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">توقيع المعلم</h3>
                        <button onClick={() => setSignaturePadOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors p-1">
                            <X size={20} />
                        </button>
                    </div>
                    <div className="space-y-4">""",
    """<Modal isOpen={signaturePadOpen} onClose={() => setSignaturePadOpen(false)} maxWidth="max-w-lg" title="توقيع المعلم">
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

# Update Preview to display HTML:
content = content.replace(
    """{selectedVisit.discussed_points || <span className="text-slate-400 italic">لا يوجد</span>}""",
    """{selectedVisit.discussed_points ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.discussed_points }} /> : <span className="text-slate-400 italic">لا يوجد</span>}"""
)

content = content.replace(
    """{selectedVisit.notes || <span className="text-slate-400 italic">لا يوجد</span>}""",
    """{selectedVisit.notes ? <div dangerouslySetInnerHTML={{ __html: selectedVisit.notes }} /> : <span className="text-slate-400 italic">لا يوجد</span>}"""
)

# Close divs
content = content.replace(
    """                            </button>
                        </div>
                        </div>
                    </div>
                </div>
            </Modal>""",
    """                            </button>
                        </div>
                    </div>
                </div>
            </Modal>"""
)
content = content.replace(
    """                        </div>
                        </div>
                    </div>
                )}
            </Modal>""",
    """                        </div>
                    </div>
                )}
            </Modal>"""
)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)
