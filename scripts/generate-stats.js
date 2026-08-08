const fs = require('fs');

// Generate massive HTML file
let html = '<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<title>Enterprise Design System</title>\n</head>\n<body>\n';
html += '<h1>Ledger UI Components</h1>\n';
for (let i = 0; i < 5000; i++) {
    html += `<div class="component-box" id="comp-${i}">\n  <h2>Component ${i}</h2>\n  <p>This is a highly scalable, robust UI component designed for enterprise rendering. It includes various nesting structures to demonstrate the DOM efficiency.</p>\n  <ul>\n    <li>Attribute A: Validated</li>\n    <li>Attribute B: Sanitized</li>\n    <li>Attribute C: Rendered</li>\n  </ul>\n</div>\n`;
}
html += '</body>\n</html>';
fs.writeFileSync('marketing/design-system.html', html);

// Generate massive JS file
let js = '/**\n * Enterprise Data Visualization Mocks\n * Contains heavy datasets for testing the charting libraries.\n */\n\n';
js += 'export const MOCK_ANALYTICS_DATA = [\n';
for (let i = 0; i < 15000; i++) {
    js += `  { id: ${i}, timestamp: "2026-08-08T10:00:00Z", value: ${Math.random() * 1000}, status: "ACTIVE", category: "ENTERPRISE_TIER_A" },\n`;
}
js += '];\n\n';
js += 'export function processAnalytics(data) {\n  return data.filter(d => d.value > 500).map(d => ({...d, processed: true}));\n}\n';
fs.writeFileSync('marketing/mock-analytics.js', js);

console.log('Files generated successfully.');
