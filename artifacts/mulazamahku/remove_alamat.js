const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'services', 'dummyData.ts');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/\s*alamat:\s*".*",\r?\n/g, '\n');

fs.writeFileSync(file, content);
console.log('Removed alamat fields');
