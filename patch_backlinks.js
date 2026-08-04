const fs = require('fs');
const path = require('path');

const basePath = 'd:/ThreadMark/frontend/src/app';

const targets = [
  { p: 'buyer/profile/page.tsx', h: '/buyer' },
  { p: 'buyer/rfqs/page.tsx', h: '/buyer' },
  { p: 'cart/page.tsx', h: '/buyer' },
  { p: 'checkout/page.tsx', h: '/buyer' },
  { p: 'checkout/confirmation/page.tsx', h: '/buyer' },
  { p: 'compare/page.tsx', h: '/buyer' },
  { p: 'supplier/orders/page.tsx', h: '/supplier' },
  { p: 'supplier/products/page.tsx', h: '/supplier' },
  { p: 'supplier/products/new/page.tsx', h: '/supplier' },
  { p: 'supplier/products/[id]/edit/page.tsx', h: '/supplier/products', l: 'Back to catalogue' },
  { p: 'supplier/profile/page.tsx', h: '/supplier' },
  { p: 'supplier/rfqs/page.tsx', h: '/supplier' },
  { p: 'supplier/samples/page.tsx', h: '/supplier' },
  { p: 'admin/buyers/page.tsx', h: '/admin' },
  { p: 'admin/orders/page.tsx', h: '/admin' },
  { p: 'admin/products/page.tsx', h: '/admin' },
  { p: 'admin/suppliers/page.tsx', h: '/admin' }
];

for (const t of targets) {
  const file = path.join(basePath, t.p);
  if (!fs.existsSync(file)) {
    console.log('Not found:', file);
    continue;
  }
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('BackLink')) {
    console.log('Already patched:', file);
    continue;
  }
  
  const importStmt = `import {BackLink} from "@/components/back-link";`;
  if (content.includes('"use client";')) {
    content = content.replace('"use client";', '"use client";' + importStmt);
  } else {
    content = importStmt + content;
  }
  
  const tag = t.l ? `<BackLink href="${t.h}" label="${t.l}"/>` : `<BackLink href="${t.h}"/>`;
  content = content.replace(/(<main[^>]*>)/, `$1${tag}`);
  
  fs.writeFileSync(file, content);
  console.log('Patched:', file);
}
