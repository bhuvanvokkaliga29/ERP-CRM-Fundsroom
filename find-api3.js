const https = require('https');

https.get('https://erp-crm-fundsroom-three.vercel.app/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const match = data.match(/src="(\/assets\/index-[^"]+)"/);
    if (match) {
      const jsUrl = 'https://erp-crm-fundsroom-three.vercel.app' + match[1];
      console.log('Fetching JS:', jsUrl);
      https.get(jsUrl, (jsRes) => {
        let jsData = '';
        jsRes.on('data', chunk => jsData += chunk);
        jsRes.on('end', () => {
          // Find the API_URL assignment or fallback
          const urlMatch = jsData.match(/[a-zA-Z0-9_$]+="http:\/\/localhost:3001\/api\/v1"/);
          if (urlMatch) {
            console.log('Using localhost fallback:', urlMatch[0]);
          }
          
          // Let's just grab the 100 characters before and after "/auth/login"
          const idx = jsData.indexOf('/auth/login');
          if (idx !== -1) {
            console.log('Found /auth/login context:');
            console.log(jsData.substring(idx - 100, idx + 100));
          } else {
            console.log('Could not find /auth/login');
          }
        });
      });
    } else {
      console.log('Could not find JS bundle');
    }
  });
});
