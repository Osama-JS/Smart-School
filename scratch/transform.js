const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'xampp', 'htdocs', 'Smart-School', 'resources', 'js', 'Pages', 'Academic', 'Timetables', 'ReportIndex.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Rename Component
content = content.replace('export default function TimetableIndex', 'export default function TimetableReportIndex');

// 2. Change Import of AdminLayout to ReportPrintLayout, remove modal imports
content = content.replace("import AdminLayout from '@/Layouts/AdminLayout';", "import AdminLayout from '@/Layouts/AdminLayout';\nimport ReportPrintLayout from '@/Components/Reports/ReportPrintLayout';");
content = content.replace("import Modal from '@/Components/Modal';", "");

// 3. Remove Slot Modal state and handlers
content = content.replace(/const \[isModalOpen, setIsModalOpen\] = useState\(false\);[\s\S]*?const closeModal = \(\) => \{[\s\S]*?\};\n/g, '');

// 4. Remove assign/unassign handlers
content = content.replace(/const handleAssign = \(\{ subjectId, teacherId, autoAssignTeacher \}\) => \{[\s\S]*?\}\);/g, '');
content = content.replace(/const handleUnassign = \(day, periodId\) => \{[\s\S]*?\}\);/g, '');

// 5. Replace AdminLayout with AdminLayout + ReportPrintLayout wrap
// I'll do this by matching the AdminLayout opening and finding the timetable table.
// Wait, it's easier to just find the table part and change the cells to print-friendly cells.

// Find the slot rendering:
const unassignBtnRegex = /<button onClick=\{\(\) => handleUnassign.*?<\/button>/g;
content = content.replace(unassignBtnRegex, '');

// Find the empty slot rendering (the Plus button)
const addBtnRegex = /<button[\s\S]*?openSlotModal[\s\S]*?<\/button>/g;
content = content.replace(addBtnRegex, '<div className="w-full h-full min-h-[80px] rounded-xl border border-dashed border-slate-200 bg-slate-50/50 print:border-black/20 print:bg-transparent"></div>');

// Replace table wrapper with ReportPrintLayout
// It's complex, let's just make the print layout wrap the table.
content = content.replace(
    'return (',
    `const [printSettings, setPrintSettings] = useState(() => {
        try {
            const saved = localStorage.getItem('TimetableReportPrintSettings');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return {
            title: 'الجدول المدرسي العام',
            orientation: 'landscape',
            paperSize: 'A4',
            margins: 'normal',
            scale: 0.9,
            pagesPerSheet: 1,
            showKPIs: false,
            showDetails: true,
            ecoMode: true,
            brandColor: '#2563eb'
        };
    });

    useEffect(() => {
        localStorage.setItem('TimetableReportPrintSettings', JSON.stringify(printSettings));
    }, [printSettings]);

    const handlePrint = () => window.print();

    return (`
);

content = content.replace(
    '<div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden z-10 relative">',
    `<ReportPrintLayout 
        title={printSettings.title} 
        printSettings={printSettings} 
        setPrintSettings={setPrintSettings} 
        onPrint={handlePrint}
    >
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden z-10 relative print:border-none print:shadow-none print:rounded-none">`
);

// Close ReportPrintLayout before the else branch
content = content.replace(
    '</div>\n                    </div>\n                ) : (',
    '</div>\n                    </ReportPrintLayout>\n                    </div>\n                ) : ('
);


// Change print styles for the cell
content = content.replace(/min-h-\[140px\]/g, 'min-h-[80px]');

// Remove Modal component at the end
content = content.replace(/<Modal show=\{isModalOpen\}[\s\S]*?<\/Modal>/g, '');

// Update Titles
content = content.replace('activeMenu="الجدول المدرسي"', 'activeMenu="الجدول المدرسي العام"');
content = content.replace('title="الجدول المدرسي"', 'title="تقارير الجدول المدرسي"');
content = content.replace('الجدول المدرسي للفرع', 'تقرير الجدول المدرسي العام');
content = content.replace('إدارة الجدول الأسبوعي لكل شعبة بسهولة', 'استعرض واطبع الجدول المدرسي الأسبوعي للشعبة.');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
