const puppeteer = require('puppeteer-extra');
const fs = require('fs');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ],
        userDataDir: "./chrome-profile" // برای نگه‌داشتن session
    });

    const page = await browser.newPage();

    // User-Agent + Platform
    const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36";
    await page.setUserAgent(userAgent);
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'platform', {
            get: () => "Win32"
        });
        Object.defineProperty(navigator, 'language', {
            get: () => "en-US"
        });
        Object.defineProperty(navigator, 'languages', {
            get: () => ["en-US", "en"]
        });
    });

    // اگر کوکی داری، لودش کن
    const cookiesPath = 'data/cookies.json';
    if (fs.existsSync(cookiesPath)) {
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
        console.log("🍪 کوکی‌ها لود شدند.");
    }

    // رفتن به صفحه سرچ
    const searchUrl = 'https://www.upwork.com/nx/find-work/best-matches';
    console.log("🔎 در حال رفتن به صفحه:", searchUrl);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });

    // انتظار برای بارگذاری کامل
    await page.waitForTimeout(5000);

    // تایپ "ui ux"
    const input = await page.$('input.nav-search-autosuggest-input');
    if (input) {
        await input.click({ clickCount: 3 });
        await input.type("ui ux", { delay: 150 });
    }

    await page.waitForTimeout(2000);

    // انتخاب دسته‌بندی دوم از منو
    const dropdownButton = await page.$("button[aria-haspopup='listbox']");
    if (dropdownButton) {
        await dropdownButton.click();
        await page.waitForTimeout(1000);
    }

    const secondOption = await page.$("ul[role='listbox'] > li:nth-child(2) button");
    if (secondOption) {
        await secondOption.click();
        await page.waitForTimeout(1000);
    }

    // ارسال فرم
    const form = await page.$('#navSearchForm-desktop');
    if (form) {
        await form.evaluate(f => f.submit());
    }

    console.log("✅ جستجو انجام شد، آماده اسکرپ...");

    // اینجا می‌تونی ادامه بدی برای استخراج لینک‌ها یا هر چی خواستی...

})();
