const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

const moves = {
  // Config
  'trpc/trpc.ts': 'config/trpc.config.ts',
  
  // Routers
  'trpc/trpc.router.ts': 'routers/index.ts',
  'trpc/routers/auth.router.ts': 'routers/auth.router.ts',
  'trpc/routers/cart.router.ts': 'routers/cart.router.ts',
  'trpc/routers/category.router.ts': 'routers/category.router.ts',
  'trpc/routers/customer.router.ts': 'routers/customer.router.ts',
  'trpc/routers/order.router.ts': 'routers/order.router.ts',
  'trpc/routers/payment.router.ts': 'routers/payment.router.ts',
  'trpc/routers/product.router.ts': 'routers/product.router.ts',
  'trpc/routers/user.router.ts': 'routers/user.router.ts',

  // Models
  'trpc/routers/product.mapper.ts': 'models/product.mapper.ts',

  // Utils
  'trpc/routers/product-images.ts': 'utils/product-images.ts',
  'common/default-categories.ts': 'utils/default-categories.ts',
  'common/pricing.ts': 'utils/pricing.ts',
  'common/slug.ts': 'utils/slug.ts',

  // Services
  'auth/auth.service.ts': 'services/auth.service.ts',
  'cloudinary/cloudinary.service.ts': 'services/cloudinary.service.ts',
  'prisma/prisma.service.ts': 'services/prisma.service.ts',
  'app.service.ts': 'services/app.service.ts',

  // Modules
  'auth/auth.module.ts': 'modules/auth.module.ts',
  'cloudinary/cloudinary.module.ts': 'modules/cloudinary.module.ts',
  'prisma/prisma.module.ts': 'modules/prisma.module.ts',
  'app.module.ts': 'modules/app.module.ts',

  // Controllers
  'app.controller.ts': 'controllers/app.controller.ts',
  'app.controller.spec.ts': 'controllers/app.controller.spec.ts',
  'prisma/prisma.service.spec.ts': 'services/prisma.service.spec.ts',
  
  // Main
  'main.ts': 'main.ts',
};

// Also create necessary directories
const dirsToCreate = [
  'config', 'middleware', 'routers', 'controllers', 'models', 'utils', 'services', 'modules'
];
dirsToCreate.forEach(dir => {
  const fullPath = path.join(srcDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

// Function to resolve relative import path
function getNewRelativePath(fromNew, toNew) {
  let rel = path.relative(path.dirname(fromNew), toNew).replace(/\\/g, '/');
  if (!rel.startsWith('.')) {
    rel = './' + rel;
  }
  // Remove .ts extension
  if (rel.endsWith('.ts')) {
    rel = rel.slice(0, -3);
  }
  return rel;
}

// 1. First, compute mapping from old full path to new full path
const oldToNew = {};
for (const [oldRel, newRel] of Object.entries(moves)) {
  const oldFull = path.join(srcDir, oldRel).replace(/\\/g, '/');
  const newFull = path.join(srcDir, newRel).replace(/\\/g, '/');
  oldToNew[oldFull] = newFull;
}

// Read all files to memory
const fileContents = {};
for (const oldFull of Object.keys(oldToNew)) {
  if (fs.existsSync(oldFull)) {
    fileContents[oldFull] = fs.readFileSync(oldFull, 'utf8');
  } else {
    console.warn(`File not found: ${oldFull}`);
  }
}

// Regex to find imports
const importRegex = /from\s+['"]([^'"]+)['"]/g;
const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

function replaceImports(content, oldFull, newFull) {
  let newContent = content;

  function replacer(match, importPath) {
    if (!importPath.startsWith('.')) return match; // Skip node_modules

    // Resolve old import path to absolute path
    const oldDir = path.dirname(oldFull);
    const resolvedImportPath = path.resolve(oldDir, importPath).replace(/\\/g, '/');

    // Find the target file in our moves
    // Note: The import might not have .ts extension, so we check with .ts
    const targetOldFull = resolvedImportPath + '.ts';
    const targetOldFullIndex = resolvedImportPath + '/index.ts';

    let targetNewFull = null;
    if (oldToNew[targetOldFull]) {
      targetNewFull = oldToNew[targetOldFull];
    } else if (oldToNew[targetOldFullIndex]) {
      targetNewFull = oldToNew[targetOldFullIndex];
    }

    if (targetNewFull) {
      // It was moved! Calculate new relative path
      let newImportPath = getNewRelativePath(newFull, targetNewFull);
      if (newImportPath.endsWith('/index')) {
        newImportPath = newImportPath.slice(0, -6);
        if (newImportPath === '' || newImportPath === '.') newImportPath = './';
      }
      return match.replace(importPath, newImportPath);
    }

    // If it wasn't moved, we still need to calculate the new path because THIS file moved!
    // But since we are moving EVERYTHING, this shouldn't happen unless we missed a file.
    // Let's assume all relevant files are in `moves`.
    return match;
  }

  newContent = newContent.replace(importRegex, replacer);
  newContent = newContent.replace(dynamicImportRegex, replacer);
  return newContent;
}

// Process and move files
for (const [oldFull, content] of Object.entries(fileContents)) {
  const newFull = oldToNew[oldFull];
  const newContent = replaceImports(content, oldFull, newFull);
  
  // Ensure dir exists
  fs.mkdirSync(path.dirname(newFull), { recursive: true });
  
  // Write to new location
  if (oldFull !== newFull) {
    fs.writeFileSync(newFull, newContent, 'utf8');
    fs.unlinkSync(oldFull); // Delete old file
    console.log(`Moved & Updated: ${path.relative(srcDir, oldFull)} -> ${path.relative(srcDir, newFull)}`);
  } else {
    fs.writeFileSync(newFull, newContent, 'utf8');
    console.log(`Updated in place: ${path.relative(srcDir, oldFull)}`);
  }
}

// Clean up old directories
const dirsToRemove = ['auth', 'cloudinary', 'common', 'prisma', 'trpc/routers', 'trpc'];
for (const dir of dirsToRemove) {
  const fullPath = path.join(srcDir, dir);
  if (fs.existsSync(fullPath)) {
    try {
      fs.rmSync(fullPath, { recursive: true, force: true });
      console.log(`Removed directory: ${dir}`);
    } catch (e) {
      console.warn(`Could not remove ${dir}: ${e.message}`);
    }
  }
}

console.log('Refactoring complete!');
