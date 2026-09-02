import os

file_path = r'c:\xampp\htdocs\Smart-School\resources\js\Pages\HR\Reports\EmployeeViolations.jsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

replacements = {
    'TeacherAbsences': 'EmployeeViolations',
    'absences': 'employeesData',
    'totalAbsences': 'totalViolations',
    'totalLates': 'totalPending',
    'uniqueTeachers': 'uniqueViolators',
    'total_absent': 'total_violations',
    'total_late': 'pending_violations',
    'unique_teachers': 'unique_violators',
    'teachers': 'employeesData',
    'teacherAbsencesPrintSettings': 'employeeViolationsPrintSettings',
    'teacher': 'employee',
    'Teacher': 'Employee',
    'معلم': 'موظف',
    'المعلمين': 'الموظفين',
    'غياب': 'مخالفات',
    'تأخير': 'إجراءات قيد الانتظار',
    'absent': 'pending',
    'late': 'action_taken',
    'employee_name': 'employee_name',
    'status_code': 'status',
    'late_minutes': 'repetition_level',
    'مخالفات بدون عذر': 'قيد الإجراء',
    'إجراءات قيد الانتظار': 'تم اتخاذ إجراء',
    'استئذان': 'استئذان',
    'إجازة / مرضي': 'إجازة',
    'hr.reports.teacher-absences': 'hr.reports.employee-violations'
}

for old, new in replacements.items():
    content = content.replace(old, new)

# manual fixes for the table headers and rendering logic
content = content.replace(
    "{ text: 'التاريخ', style: 'tableHeader', alignment: 'center' },\n                    { text: 'اليوم', style: 'tableHeader', alignment: 'center' },\n                    { text: 'الحالة', style: 'tableHeader', alignment: 'center' },\n                    { text: 'دقائق تم اتخاذ إجراء', style: 'tableHeader', alignment: 'center' }",
    "{ text: 'تاريخ المخالفة', style: 'tableHeader', alignment: 'center' },\n                    { text: 'نوع المخالفة', style: 'tableHeader', alignment: 'center' },\n                    { text: 'مستوى التكرار', style: 'tableHeader', alignment: 'center' },\n                    { text: 'الحالة', style: 'tableHeader', alignment: 'center' }"
)

content = content.replace(
    "{ text: formatDateStr(record.date), alignment: 'center' },\n                        { text: record.day, alignment: 'center' },\n                        { text: record.status, alignment: 'center' },\n                        { text: record.repetition_level ? record.repetition_level.toString() : '-', alignment: 'center' }",
    "{ text: formatDateStr(record.violation_date), alignment: 'center' },\n                        { text: record.type_name, alignment: 'center' },\n                        { text: record.repetition_level ? record.repetition_level.toString() : '-', alignment: 'center' },\n                        { text: record.status, alignment: 'center' }"
)

content = content.replace("تقرير حضور وانصراف الموظفين", "تقرير مخالفات الموظفين")
content = content.replace("تقرير الغياب والتأخير للموظفين", "تقرير مخالفات الموظفين")
content = content.replace("عرض وطباعة سجلات الغياب، التأخير، والاستئذان للكادر التعليمي", "عرض وطباعة سجلات المخالفات والإجراءات المتخذة للموظفين")
content = content.replace("إجمالي المخالفات:", "إجمالي المخالفات:")
content = content.replace("إجمالي الإجراءات قيد الانتظار:", "إجمالي قيد الإجراء:")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
