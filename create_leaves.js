const fs = require('fs');

let content = fs.readFileSync('resources/js/Pages/HR/Reports/EmployeeAchievements.jsx', 'utf8');

// Replacements
content = content.replace(/EmployeeAchievements/g, 'EmployeeLeaves');
content = content.replace(/employee-achievements/g, 'employee-leaves');
content = content.replace(/achievements/g, 'leaves');
content = content.replace(/Achievements/g, 'Leaves');
content = content.replace(/achievement/g, 'leave');
content = content.replace(/Achievement/g, 'Leave');

content = content.replace(/إنجازات/g, 'إجازات');
content = content.replace(/الإنجازات/g, 'الإجازات');
content = content.replace(/إنجاز/g, 'إجازة');
content = content.replace(/المنجزين/g, 'المجازين');

// Custom field replacements inside the file for Table headers and body
content = content.replace(/<th>\s*نوع الإجازة\s*<\/th>/g, '<th>نوع الإجازة</th>\n<th>من تاريخ</th>\n<th>إلى تاريخ</th>\n<th>عدد الأيام</th>\n<th>حالة الطلب</th>');
content = content.replace(/{record.type_name}/g, '{record.type_name}</td>\n<td className="px-4 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap">{formatDateStr(record.start_date)}</td>\n<td className="px-4 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap">{formatDateStr(record.end_date)}</td>\n<td className="px-4 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap">{record.days}</td>\n<td className="px-4 py-3 text-[13px] font-semibold text-slate-700 whitespace-nowrap">{record.status === "approved" ? "مقبول" : record.status === "pending" ? "قيد الانتظار" : "مرفوض"}');

content = content.replace(/<div className="flex-1 min-w-0">\s*<div className="font-bold text-slate-800 text-\[13px\]">\s*{record.type_name}\s*<\/div>\s*<\/div>/g, '<div className="flex-1 min-w-0"><div className="font-bold text-slate-800 text-[13px]">{record.type_name}</div><div className="text-xs text-slate-500 mt-0.5">{formatDateStr(record.start_date)} - {formatDateStr(record.end_date)} ({record.days} يوم)</div></div>');

content = content.replace(/total_points/g, 'total_leave_days');
content = content.replace(/points/g, 'leave_days'); // wait, the controller outputs `days` for each record, not points.

// Let's replace 'points' with 'days' in specific places.
content = content.replace(/<th>\s*النقاط\s*<\/th>/g, '');
content = content.replace(/<td className="px-4 py-3 whitespace-nowrap">\s*<div className="inline-flex items-center justify-center px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-100">\s*\+\s*{record.leave_days}\s*نقطة\s*<\/div>\s*<\/td>/g, '');

content = content.replace(/<th>\s*تفاصيل الإجازة\s*<\/th>/g, '<th>ملاحظات الإجازة</th>');

// PDF mapping updates
content = content.replace(/\[\s*'#',\s*'تاريخ الإجازة',\s*'نوع الإجازة',\s*'النقاط',\s*'تفاصيل الإجازة'\s*\]/g, "['#', 'تاريخ البدء', 'تاريخ الانتهاء', 'عدد الأيام', 'نوع الإجازة', 'الحالة']");

content = content.replace(/\[\s*index \+ 1,\s*formatDateStr\(record.leave_date\),\s*record.type_name,\s*record.leave_days\.toString\(\),\s*record.details \|\| '-'\s*\]/g, "[index + 1, formatDateStr(record.start_date), formatDateStr(record.end_date), record.days.toString(), record.type_name, record.status === 'approved' ? 'مقبول' : record.status === 'pending' ? 'قيد الانتظار' : 'مرفوض']");

// Drop some specific lines like total points in employee row
content = content.replace(/<div className="text-\[11px\] text-slate-400 mt-1">مجموع النقاط<\/div>\s*<div className="font-black text-slate-700 text-sm mt-0.5">{employee.total_leave_days}<\/div>/g, '<div className="text-[11px] text-slate-400 mt-1">مجموع أيام الغياب/الإجازات</div><div className="font-black text-slate-700 text-sm mt-0.5">{employee.total_leave_days}</div>');

fs.writeFileSync('resources/js/Pages/HR/Reports/EmployeeLeaves.jsx', content);
