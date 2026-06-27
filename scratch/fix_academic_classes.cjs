const fs = require('fs');
const filePath = 'C:/xampp/htdocs/Smart-School/resources/js/Pages/Academic/Structure/Index.jsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace standard dark-XXX classes with slate-XXX
// e.g. text-dark-900 -> text-slate-900
// bg-dark-50 -> bg-slate-50
// dark:bg-dark-800 -> dark:bg-slate-800
content = content.replace(/([a-zA-Z:]+)-dark-([0-9]{2,3})/g, '$1-slate-$2');

// Just in case there are standalone dark-XXX classes without prefixes (like dark-900)
// wait, usually it's text-dark-900.
// Let's also check for any remaining dark-XXX
content = content.replace(/\bdark-([0-9]{2,3})\b/g, 'slate-$1');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed dark to slate classes!');
