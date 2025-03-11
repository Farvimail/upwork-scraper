const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto('https://www.upwork.com/ab/account-security/login', { waitUntil: 'networkidle2' });

    console.log("✅ در حال وارد کردن اطلاعات ورود...");

    // **وارد کردن نام کاربری**
    await page.waitForSelector('input#login_username', { visible: true });
    await page.type('input#login_username', 'farvimail@gmail.com', { delay: 100 });

    // **کلیک روی دکمه "Continue"**
    await page.waitForSelector('#login_password_continue', { visible: true });
    await page.click('#login_password_continue');

    // **صبر دستی برای بارگذاری فیلد پسورد**
    await new Promise(resolve => setTimeout(resolve, 3000));

    // **وارد کردن پسورد**
    await page.waitForSelector('input#login_password', { visible: true });
    await page.type('input#login_password', '13759658@Up', { delay: 100 });

    console.log("✅ در حال کلیک روی دکمه ورود...");

    // **کلیک روی دکمه ادامه پس از ورود پسورد**
    await page.waitForSelector('#login_control_continue', { visible: true });
    await page.click('#login_control_continue');

    await page.waitForNavigation({ waitUntil: 'networkidle2' });

    console.log("✅ ورود موفقیت‌آمیز بود!");

    // **ذخیره کوکی‌ها برای ورود بعدی**
    const cookies = await page.cookies();
    fs.writeFileSync('data/cookies.json', JSON.stringify(cookies, null, 2));
    console.log("🍪 کوکی‌های ورود ذخیره شدند!");

    await browser.close();
})();
