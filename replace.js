const fs = require('fs');

let content = fs.readFileSync('c:\\xampp\\htdocs\\Smart-School\\resources\\js\\Pages\\HR\\Reports\\EmployeeAchievements.jsx', 'utf8');

// Replacements
content = content.replace(/EmployeeViolations/g, 'EmployeeAchievements');
content = content.replace(/employee-violations/g, 'employee-achievements');
content = content.replace(/مخالفات الموظفين/g, 'إنجازات الموظفين');
content = content.replace(/المخالفات/g, 'الإنجازات');
content = content.replace(/مخالفة/g, 'إنجاز');
content = content.replace(/totalemployeesData/g, 'totalAchievements');
content = content.replace(/totalPending/g, 'totalPoints');
content = content.replace(/uniqueViolators/g, 'uniqueAchievers');
content = content.replace(/الموظفين المخالفين/g, 'الموظفين المنجزين');
content = content.replace(/إجمالي الإجراءات/g, 'إجمالي النقاط');
content = content.replace(/القسم الأكثر إنجاز/g, 'القسم الأكثر إنجازاً');
content = content.replace(/pending_violations/g, 'total_points');
content = content.replace(/total_violations/g, 'total_achievements');
content = content.replace(/mostpendingDept/g, 'mostAchievingDept');
content = content.replace(/قيد الإجراء/g, 'نقاط الإنجاز');
content = content.replace(/تم اتخاذ إجراء/g, 'اعتماد الإدارة');
content = content.replace(/نوع الـإنجاز/g, 'نوع الإنجاز'); // fix if any
content = content.replace(/مستوى التكرار/g, 'النقاط');
content = content.replace(/AlertTriangle/g, 'Trophy');
content = content.replace(/XCircle/g, 'Star');

fs.writeFileSync('c:\\xampp\\htdocs\\Smart-School\\resources\\js\\Pages\\HR\\Reports\\EmployeeAchievements.jsx', content, 'utf8');
console.log('Done!');
