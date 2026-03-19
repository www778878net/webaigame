const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        headless: false,
        args: ['--disable-web-security']
    });
    const page = await browser.newPage();
    
    const errors = [];
    const networkErrors = [];
    
    page.on('pageerror', error => {
        errors.push(`[PageError] ${error.message}`);
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') {
            errors.push(`[Console] ${msg.text()}`);
        }
    });
    
    page.on('response', response => {
        if (response.status() === 404) {
            networkErrors.push(`[404] ${response.url()}`);
        }
    });
    
    try {
        await page.goto('http://127.0.0.1:8000/index.html', { waitUntil: 'load' });
        await new Promise(r => setTimeout(r, 3000));
        
        if (networkErrors.length > 0) {
            console.log('\n=== 网络错误 ===\n');
            networkErrors.forEach(e => console.log(e));
        }
        if (errors.length > 0) {
            console.log('\n=== JS 错误 ===\n');
            errors.forEach(e => console.log(e));
        }
        if (networkErrors.length === 0 && errors.length === 0) {
            console.log('=== 无错误 ===');
        }
    } catch (e) {
        console.log('导航错误:', e.message);
    }
    
    await browser.close();
})();
