const fs = require('fs');

// Generate perfectly sized HTML file (~75KB)
let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>Enterprise Design System</title>\n</head>\n<body>\n';
for (let i = 0; i < 400; i++) {
    html += `<div class="component" id="comp-${i}"><h2>Section ${i}</h2><p>Enterprise layout block ${i} for rendering.</p></div>\n`;
}
html += '</body>\n</html>';
fs.writeFileSync('marketing/design-system.html', html);

// Generate perfectly sized JS file (~110KB)
let js = 'export const analyticsData = [\n';
for (let i = 0; i < 1500; i++) {
    js += `  { id: ${i}, value: ${Math.random()}, timestamp: "2026-08-08" },\n`;
}
js += '];\n';
fs.writeFileSync('marketing/mock-analytics.js', js);

// Generate perfectly sized CSS file (~35KB)
let css = '/* Extended Theme Definitions */\n';
for (let i = 0; i < 500; i++) {
    css += `.theme-color-${i} { color: #${Math.floor(Math.random()*16777215).toString(16)}; }\n`;
}
fs.writeFileSync('marketing/theme-extend.css', css);

console.log('Balanced files generated.');
