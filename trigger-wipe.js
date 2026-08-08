const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Intercept requests
  await page.setRequestInterception(true);
  
  let apiUrl = null;
  
  page.on('request', (req) => {
    if (req.url().includes('/auth/login') || req.url().includes('/demo/wipe-main')) {
      apiUrl = req.url();
      console.log('Intercepted API URL:', req.url());
    }
    req.continue();
  });

  page.on('response', async (res) => {
    if (res.url().includes('/demo/wipe-main')) {
      console.log('Wipe main response status:', res.status());
      try {
        const text = await res.text();
        console.log('Wipe main response body:', text);
      } catch (e) {
        console.log('Could not read body:', e);
      }
    }
  });

  try {
    console.log('Navigating to login page...');
    await page.goto('https://erp-crm-fundsroom-three.vercel.app/login', { waitUntil: 'networkidle2' });
    
    // Evaluate the click on the wipe button
    console.log('Clicking the wipe button...');
    await page.evaluate(() => {
      // Overwrite window.confirm to always return true
      window.confirm = () => true;
      window.alert = (msg) => console.log('ALERT:', msg);
      
      const btns = Array.from(document.querySelectorAll('button'));
      const wipeBtn = btns.find(b => b.textContent && b.textContent.includes('Clear Production DB'));
      if (wipeBtn) {
        wipeBtn.click();
      } else {
        console.log('Could not find wipe button');
      }
    });
    
    // Wait for the request to complete
    await new Promise(r => setTimeout(r, 5000));
    
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
