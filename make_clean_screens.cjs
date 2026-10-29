const fs = require('fs');
const path = require('path');

const css = fs.readFileSync('dist/assets/index-CNlYpBTK.css', 'utf8');
const files = fs.readdirSync('screens_html').filter(f => f.endsWith('.html'));

const outDir = 'screens_clean';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const file of files) {
  const content = fs.readFileSync(path.join('screens_html', file), 'utf8');
  const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    let body = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    ${css}
    body { font-family: 'Inter', sans-serif !important; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans">
  ${body}
</body>
</html>`;
    fs.writeFileSync(path.join(outDir, file), fullHtml, 'utf8');
    console.log(`${file} -> size: ${(fullHtml.length / 1024).toFixed(1)} KB`);
  }
}
