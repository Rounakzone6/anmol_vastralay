const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../app');
const pages = [
  { name: 'FAQ', path: 'faq/page.tsx' },
  { name: 'Terms & Conditions', path: 'terms/page.tsx' },
  { name: 'Privacy Policy', path: 'privacy/page.tsx' },
  { name: 'Shipping & Returns', path: 'shipping/page.tsx' },
  { name: 'Contact Us', path: 'contact/page.tsx' }
];

let knowledgeBase = [];

pages.forEach(page => {
  const fullPath = path.join(pagesDir, page.path);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    
    // Very basic JSX text extraction: strip imports, exports, HTML tags
    let text = content
      .replace(/import.*?;/g, '') // Remove imports
      .replace(/export default function.*?{/g, '') // Remove function signature
      .replace(/<[^>]+>/g, ' ') // Remove HTML/JSX tags
      .replace(/className="[^"]*"/g, '') // Remove classNames
      .replace(/className=\{[^}]*\}/g, '')
      .replace(/\{[^\}]*\}/g, ' ') // Remove JS expressions in JSX
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();

    knowledgeBase.push({
      topic: page.name,
      content: text
    });
  }
});

const outputPath = path.join(__dirname, '../lib/knowledgeBase.json');
fs.writeFileSync(outputPath, JSON.stringify(knowledgeBase, null, 2));

console.log('Knowledge base built at ' + outputPath);
