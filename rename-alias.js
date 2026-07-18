const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist' && file !== '.git') {
        walk(p, callback);
      }
    } else if (p.endsWith('.ts') || p.endsWith('.tsx')) {
      callback(p);
    }
  }
}

const srcDir = path.join(__dirname, 'anmol-backend', 'src');
console.log('Refactoring backend to use @backend/...');
let count = 0;

walk(srcDir, (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  const importRegex = /(from\s+['"]|import\s+['"])@\//g;
  
  if (importRegex.test(content)) {
    const newContent = content.replace(/(from\s+['"]|import\s+['"])@\//g, '$1@backend/');
    fs.writeFileSync(filePath, newContent, 'utf8');
    count++;
  }
});

console.log(`Backend refactored: ${count} files changed.`);
