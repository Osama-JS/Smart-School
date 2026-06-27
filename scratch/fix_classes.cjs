const fs = require('fs');

const filePath = 'C:/xampp/htdocs/Smart-School/resources/js/Pages/HR/Reports/Templates/Index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace invalid slate classes
content = content.replace(/slate-101/g, 'slate-100');
content = content.replace(/slate-150/g, 'slate-100');
content = content.replace(/slate-202/g, 'slate-200');
content = content.replace(/slate-205/g, 'slate-200');
content = content.replace(/slate-405/g, 'slate-400');
content = content.replace(/slate-450/g, 'slate-400');
content = content.replace(/slate-550/g, 'slate-500');
content = content.replace(/slate-655/g, 'slate-600');
content = content.replace(/slate-805/g, 'slate-800');
content = content.replace(/slate-850/g, 'slate-800');
content = content.replace(/slate-855/g, 'slate-800');
content = content.replace(/slate-955/g, 'slate-900');
content = content.replace(/red-650/g, 'red-600');

// Fix wrong radial gradient
content = content.replace(/#5b8a2d/g, '#27313f');

// Fix border-r-4 hover
content = content.replace(/hover:bg-primary-500\/5/g, 'hover:bg-primary-500/10');

// Save it back
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed classes successfully!');
