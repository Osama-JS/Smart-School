import re

file_path = r'c:\xampp\htdocs\Smart-School\resources\js\Pages\HR\Reports\AdministrativeRequests.jsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replacements
content = content.replace('EmployeeLeaves', 'AdministrativeRequests')
content = content.replace('hr.reports.employee-leaves', 'hr.reports.administrative-requests')
content = content.replace('achieversOnly', 'requestsOnly')
content = content.replace('setAchieversOnly', 'setRequestsOnly')
content = content.replace('achievers_only', 'requests_only')
content = content.replace('تقرير إجازات الموظفين', 'تقرير الطلبات الإدارية')
content = content.replace('عرض المجازين فقط', 'عرض مقدمي الطلبات فقط')
content = content.replace('من لديه إجازات', 'من قدم طلبات')
content = content.replace('إجمالي الإجازات', 'إجمالي الطلبات')
content = content.replace('total_leaves', 'total_requests')
content = content.replace('totalLeaves', 'totalRequests')
content = content.replace('total_leave_days', 'total_leave_days_not_used') # We don't have days
content = content.replace('totalLeaveDays', 'totalLeaveDaysNotUsed')
content = content.replace('unique_employees_on_leave', 'unique_employees_with_requests')
content = content.replace('uniqueEmployeesOnLeave', 'uniqueEmployeesWithRequests')
content = content.replace('نوع الإجازة', 'نوع الطلب')

# Table Headers
content = content.replace('{ text: \'الأيام\', style: \'tableHeader\', alignment: \'center\' },', '{ text: \'حالة الطلب\', style: \'tableHeader\', alignment: \'center\' },')
content = content.replace('<th className="py-3 px-4 font-bold text-center w-32 border-l border-white/20">الأيام</th>', '<th className="py-3 px-4 font-bold text-center w-32 border-l border-white/20">حالة الطلب</th>')

# Data rows map
content = content.replace('{ text: record.days ? record.days.toString() : \'-\', alignment: \'center\' },', '{ text: record.status ? record.status : \'-\', alignment: \'center\' },')

# The employee row group span for days -> status
content = content.replace('<span className="font-semibold text-emerald-600">+{leave.days ? leave.days : \'0\'}</span>', '<span className={`font-semibold px-2 py-1 rounded-full text-xs ${leave.status === \'معتمد\' ? \'bg-emerald-100 text-emerald-700\' : leave.status === \'مرفوض\' ? \'bg-red-100 text-red-700\' : \'bg-amber-100 text-amber-700\'}`}>{leave.status ? leave.status : \'معلق\'}</span>')

# KPI display for days
content = re.sub(r'\{printSettings\.showKPIs.*?</div>\s*</div>', '', content, flags=re.DOTALL) # We will replace the whole KPI grid manually later if needed, but let's just delete the days block
content = content.replace('<p className="text-slate-500 text-xs font-bold mb-0.5">إجمالي الأيام</p>', '<p className="text-slate-500 text-xs font-bold mb-0.5">طلبات غير معتمدة</p>')
content = content.replace('<p className="text-lg font-black leading-none text-slate-800">{totalLeaveDaysNotUsed}</p>', '<p className="text-lg font-black leading-none text-slate-800">-</p>')

# Chart
content = content.replace('<Bar dataKey="total_days" name="إجمالي الأيام" fill="#10b981" radius={[4, 4, 0, 0]} barSize={28} />', '')

# Remove some left over leave days mentions in the header
content = content.replace('{ text: `إجمالي الأيام: ${totalLeaveDaysNotUsed}`, alignment: \'right\' }', '{ text: ``, alignment: \'right\' }')

# In the sub component
content = content.replace('<span>الأيام: {totalLeaveDaysNotUsed}</span>', '')
content = content.replace('const isHighAchiever = totalLeaveDaysNotUsed >= 50 || leavesCount >= 5;', 'const isHighAchiever = leavesCount >= 5;')


with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
