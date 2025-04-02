const puppeteer = require('puppeteer');
const fs = require('fs');

// Stealth دستی
const applyStealth = async (page) => {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
};

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    });

    // const context = await browser.createIncognitoBrowserContext();
    const page = await browser.newPage();

    // فعال‌سازی Stealth
    await applyStealth(page);
/*
    // 📌 لود کوکی‌ها
    const cookiesPath = 'data/cookies.json';
    if (fs.existsSync(cookiesPath)) {
        console.log("🍪 بارگذاری کوکی‌ها...");
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
    }*/

    // 📱 User-Agent تصادفی
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    // 🖱️ حرکت موس و کلیک تصادفی
    await page.mouse.move(Math.random() * 800, Math.random() * 600);
    await new Promise(resolve => setTimeout(resolve, 2000));
    // await page.mouse.click(Math.random() * 800, Math.random() * 600);

    // 🚀 رفتن به صفحه سرچ
    const searchUrl = 'https://www.upwork.com/nx/search/talent/?nbs=1&q=react&page=287';
    console.log('ℹ️ در حال رفتن به صفحه جستجو:', searchUrl);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
    
    await new Promise(resolve => setTimeout(resolve, 4000));
/*
    // تایپ کردن عبارت "ui ux" در سرچ با استفاده از select و type
    const input = await page.$("#navSearchForm-desktop > div.nav-search-input-container > input.nav-search-autosuggest-input");
    if (input) {
        await input.click({ clickCount: 3 }); // انتخاب کل متن قبلی
        await input.type("ui ux", { delay: 100 });
    }

    // 🖱️ حرکت موس و کلیک تصادفی
    await page.mouse.move(Math.random() * 800, Math.random() * 600);

    // کلیک روی دکمه دراپ‌داون
    const dropdownButton = await page.$("#navSearchForm-desktop > div.nav-search-dropdown-container > button");
    if (dropdownButton) {
        await dropdownButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // ۱ ثانیه تأخیر
    }

    // 🖱️ حرکت موس و کلیک تصادفی
    await page.mouse.move(Math.random() * 800, Math.random() * 600);

    // انتخاب اولین گزینه از لیست
    const firstOption = await page.$("#navSearchForm-desktop > div.nav-search-dropdown-container > ul > li:nth-child(2) > button");
    if (firstOption) {
        await firstOption.click();
        await new Promise(resolve => setTimeout(resolve, 1000)); // ۱ ثانیه تأخیر
    }

    // 🖱️ حرکت موس و کلیک تصادفی
    await page.mouse.move(Math.random() * 800, Math.random() * 600);

    // کلیک روی فرم برای ارسال
    const searchForm = await page.$("#navSearchForm-desktop");
    if (searchForm) {
        await searchForm.evaluate(form => form.submit());
    }

    // 🖱️ حرکت موس و کلیک تصادفی
    await page.mouse.move(Math.random() * 800, Math.random() * 600);*/

    await new Promise(resolve => setTimeout(resolve, 10000));

    console.log('✅ صفحه جستجو بارگذاری شد. منتظر بارگذاری نتایج...');

    // 👇 از اینجا به بعد همون کد قبلیه (اسکرول، استخراج، ذخیره لینک‌ها)
    // ✅ بررسی تعداد صفحات
    let totalPages = await page.evaluate(() => {
        let paginationElement = document.querySelector(".air3-pagination-mobile");
        return paginationElement ? parseInt(paginationElement.innerText.trim().replace(",", "").split(" ").slice(-1)[0]) : 1;
    });

    console.log(`📊 تعداد کل صفحات: ${totalPages}`);

    const filePath = 'data/uiux_profiles.json';
    let existingLinks = new Set();

    try {
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            existingLinks = new Set(rawData.trim() ? JSON.parse(rawData) : []);
        }
    } catch (error) {
        console.error('❌ خطا در خواندن فایل JSON:', error);
    }

    for (let currentPage = 287; currentPage <= totalPages; currentPage++) {
        console.log(`📄 پردازش صفحه ${currentPage}...`);

        let lastHeight = await page.evaluate(() => document.body.scrollHeight);
        while (true) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));
            let newHeight = await page.evaluate(() => document.body.scrollHeight);
            if (newHeight === lastHeight) break;
            lastHeight = newHeight;
        }

        try {
            await page.waitForSelector('h4 a', { timeout: 10000 });
        } catch {
            console.log("🚨 لینک‌های پروفایل پیدا نشدند!");
            continue;
        }

        let profileLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("h4 a"))
                .map(link => link.href)
                .filter(href => href.includes("/freelancers/"));
        });

        profileLinks.forEach(link => existingLinks.add(link));
        console.log(`ℹ️ تعداد لینک‌های یکتای استخراج‌شده تا الان: ${existingLinks.size}`);

        try {
            fs.mkdirSync('data', { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify([...existingLinks], null, 2));
            console.log(`✅ ذخیره ${existingLinks.size} لینک در فایل`);
        } catch (err) {
            console.error("❌ خطا در ذخیره‌سازی:", err);
        }

        if (currentPage === totalPages) break;

        console.log(`⏭️ رفتن به صفحه ${currentPage + 1}...`);
        let nextPageButton = await page.$(`div.air3-card-section > nav > ul > li:nth-child(${currentPage < 4 ? 5 + currentPage : 8}) > button`);

        if (!nextPageButton) {
            console.log(`🚨 دکمه صفحه بعد پیدا نشد`);
            break;
        }

        await nextPageButton.click();
        await new Promise(resolve => setTimeout(resolve, 12000));
        await page.mouse.move(Math.random() * 800, Math.random() * 600);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🚀 عملیات تموم شد. مرورگر باز می‌مونه برای بررسی دستی.');
})();
