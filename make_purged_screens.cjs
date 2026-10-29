const fs = require('fs');
const { PurgeCSS } = require('purgecss');
const path = require('path');

async function processAll() {
  const css = fs.readFileSync('dist/assets/index-CNlYpBTK.css', 'utf8');
  const files = fs.readdirSync('screens_html').filter(f => f.endsWith('.html'));

  const outDir = 'screens_purged';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const file of files) {
    const rawContent = fs.readFileSync(path.join('screens_html', file), 'utf8');
    const bodyMatch = rawContent.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (!bodyMatch) continue;

    let body = bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').trim();

    // Purge CSS against the body
    const purged = await new PurgeCSS().purge({
      content: [{ raw: body, extension: 'html' }],
      css: [{ raw: css }]
    });

    const purgedCss = purged[0].css;
    const finalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
${purgedCss}
body { font-family: 'Inter', sans-serif !important; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 antialiased font-sans">
${body}
</body>
</html>`;

    const dest = path.join(outDir, file);
    fs.writeFileSync(dest, finalHtml, 'utf8');
    console.log(`${file}: Purged CSS = ${(purgedCss.length/1024).toFixed(1)}KB, Total = ${(finalHtml.length/1024).toFixed(1)}KB`);
  }
}

processAll().catch(console.error);
