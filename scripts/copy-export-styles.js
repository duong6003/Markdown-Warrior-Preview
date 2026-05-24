const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', 'src', 'webview', 'styles');
const dest = path.join(__dirname, '..', 'dist', 'export-styles');

fs.mkdirSync(dest, { recursive: true });

for (const file of ['markdown-body.css', 'themes.css', 'extensions.css']) {
  fs.copyFileSync(path.join(src, file), path.join(dest, file));
}

console.log('Export styles copied to dist/export-styles/');
