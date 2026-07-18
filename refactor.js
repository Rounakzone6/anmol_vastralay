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

function refactorBackend() {
  const srcDir = path.join(__dirname, 'anmol-backend', 'src');
  console.log('Refactoring backend...');
  let count = 0;
  
  walk(srcDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /(from\s+['"]|import\s+['"])((\.\.\/|\.\/)[^'"]+)(['"])/g;
    
    let changed = false;
    const newContent = content.replace(importRegex, (match, p1, p2, p3, p4) => {
      // p2 is the relative path, e.g. '../../models/product.model'
      const fileDir = path.dirname(filePath);
      const resolvedAbs = path.resolve(fileDir, p2);
      
      // We only want to rewrite if it's within srcDir
      if (resolvedAbs.startsWith(srcDir)) {
        const relativeToSrc = path.relative(srcDir, resolvedAbs);
        // Replace backslashes with forward slashes for imports
        const aliasPath = '@/' + relativeToSrc.replace(/\\/g, '/');
        changed = true;
        return `${p1}${aliasPath}${p4}`;
      }
      
      return match;
    });
    
    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      count++;
    }
  });
  console.log(`Backend refactored: ${count} files changed.`);
}

function refactorFrontendOrAdmin(dirName) {
  const baseDir = path.join(__dirname, dirName);
  console.log(`Refactoring ${dirName}...`);
  let count = 0;
  
  walk(baseDir, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    const importRegex = /(from\s+['"]|import\s+['"])((\.\.\/|\.\/)[^'"]+)(['"])/g;
    
    let changed = false;
    const newContent = content.replace(importRegex, (match, p1, p2, p3, p4) => {
      const fileDir = path.dirname(filePath);
      const resolvedAbs = path.resolve(fileDir, p2);
      
      // Check if the relative import points to anmol-backend/src
      const backendSrcDir = path.resolve(__dirname, 'anmol-backend', 'src');
      if (resolvedAbs.startsWith(backendSrcDir)) {
        const relativeToBackendSrc = path.relative(backendSrcDir, resolvedAbs);
        const aliasPath = '@backend/' + relativeToBackendSrc.replace(/\\/g, '/');
        changed = true;
        return `${p1}${aliasPath}${p4}`;
      }
      
      // Check if it points to within its own baseDir
      if (resolvedAbs.startsWith(baseDir)) {
        const relativeToBase = path.relative(baseDir, resolvedAbs);
        // Sometimes Next.js imports from public/ or other places, but usually we alias everything under baseDir
        const aliasPath = '@/' + relativeToBase.replace(/\\/g, '/');
        changed = true;
        return `${p1}${aliasPath}${p4}`;
      }
      
      return match;
    });
    
    if (changed) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      count++;
    }
  });
  console.log(`${dirName} refactored: ${count} files changed.`);
}

refactorBackend();
refactorFrontendOrAdmin('anmol-frontend');
refactorFrontendOrAdmin('anmol-admin');
