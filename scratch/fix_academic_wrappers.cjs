const fs = require('fs');
const filePath = 'C:/xampp/htdocs/Smart-School/resources/js/Pages/Academic/Structure/Index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard non-matching ui patterns
content = content.replace(/bg-white\/[0-9]+/g, 'bg-white dark:bg-[#121820]/60');
content = content.replace(/dark:bg-slate-[0-9]{3}\/[0-9]+/g, ''); // we already put dark:bg-[#121820]/60
content = content.replace(/backdrop-blur-[a-z0-9]+/g, '');
content = content.replace(/rounded-\[2rem\]/g, 'rounded-3xl');
content = content.replace(/border-white\/[0-9]+/g, 'border-slate-100 dark:border-slate-800');
content = content.replace(/dark:border-slate-[0-9]{3}\/[0-9]+/g, '');

// Clean up double spaces
content = content.replace(/ +/g, ' ');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed wrapper UI classes!');
