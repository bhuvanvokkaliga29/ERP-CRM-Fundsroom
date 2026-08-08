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
          const apiMatch = jsData.match(/https:\/\/[^"'\s]+\/api\/v1/g);
          console.log('Found API URLs:', Array.from(new Set(apiMatch)));
        });
      });
    } else {
      console.log('Could not find JS bundle');
    }
  });
});
