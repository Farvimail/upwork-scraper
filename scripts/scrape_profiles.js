// const puppeteer = require('puppeteer');
// const fs = require('fs');

// (async () => {
//   const browser = await puppeteer.launch({ headless: false }); // مرورگر باز بماند تا ببینیم چه اتفاقی می‌افتد
//   const page = await browser.newPage();

//   const searchUrl = 'https://www.upwork.com/nx/search/talent?q=python';
//   console.log('ℹ️ در حال رفتن به صفحه جستجو:', searchUrl);
//   await page.goto(searchUrl, { waitUntil: 'networkidle2' });
//   console.log('✅ صفحه جستجو بارگذاری شد. منتظر بارگذاری نتایج...');

//   // **دریافت تعداد کل صفحات**
//   let totalPages = await page.evaluate(() => {
//     return parseInt(document.querySelector(".air3-pagination-mobile").innerText.trim().replace(",", "").split(" ").slice(-1)[0].trim(), 10);
//   });

//   console.log(`📊 تعداد کل صفحات: ${totalPages}`);

//   let allProfileLinks = new Set(); // لینک‌های یکتا ذخیره شوند
//   let currentPage = 1;

//   while (currentPage <= totalPages) {
//     console.log(`📄 پردازش صفحه ${currentPage}...`);

//     // **انتظار برای بارگذاری لینک‌ها**
//     try {
//       await page.waitForSelector('h4 a', { timeout: 10000 });
//       console.log('✅ نتایج جستجو ظاهر شدند، در حال استخراج لینک‌ها...');
//     } catch (err) {
//       console.error('⏱️ ❌ لینک‌های پروفایل پیدا نشدند. احتمالاً مشکل در بارگذاری صفحه یا انتخاب‌کننده‌ها وجود دارد.', err);
//       break;
//     }

//     // **استخراج لینک‌های پروفایل**
//     const profileLinks = await page.$$eval('h4 a', elems =>
//       elems.map(link => link.href)
//     );

//     profileLinks.forEach(link => allProfileLinks.add(link)); // اضافه کردن به Set برای حذف تکراری‌ها
//     console.log(`ℹ️ تعداد لینک‌های یکتای استخراج‌شده تا الان: ${allProfileLinks.size}`);

//     if (currentPage >= totalPages) {
//       console.log("✅ آخرین صفحه شناسایی شد، اسکرپینگ به پایان رسید.");
//       break;
//     }

//     // **کلیک روی دکمه‌ی صفحه بعدی**
//     let nextPageButtonSelector = "";
//     if (currentPage < 4) {
//       nextPageButtonSelector = `div.air3-card-section > nav > ul > li:nth-child(${5 + currentPage}) > button`;
//     } else {
//       nextPageButtonSelector = `div.air3-card-section > nav > ul > li:nth-child(8) > button`; // همیشه nth-child(8) بعد از صفحه ۴
//     }

//     const nextPageButton = await page.$(nextPageButtonSelector);
//     if (nextPageButton) {
//       console.log(`⏭️ رفتن به صفحه ${currentPage + 1}...`);
//       await nextPageButton.click();
//       await page.waitForNavigation({ waitUntil: "networkidle2" }); // ⏳ منتظر ماندن تا صفحه بعدی کامل لود شود

//       await new Promise(resolve => setTimeout(resolve, 5000)); // صبر برای لود شدن صفحه جدید
//       currentPage++;
//     } else {
//       console.log("🚨 دکمه صفحه‌ی بعدی یافت نشد، متوقف شد!");
//       break;
//     }
//   }

//   // **📂 ذخیره در فایل JSON**
//   try {
//     fs.mkdirSync('data', { recursive: true });
//     fs.writeFileSync('data/profiles.json', JSON.stringify([...allProfileLinks], null, 2));
//     console.log('✅ لینک‌های پروفایل در فایل data/profiles.json ذخیره شدند.');
//   } catch (fileErr) {
//     console.error('❌ خطا در ذخیره‌سازی فایل:', fileErr);
//   }

//   await browser.close();
// })();
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: [
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-setuid-sandbox"
        ]
    });

    const page = await browser.newPage();

    // ✅ **انتخاب تصادفی User-Agent برای شبیه‌سازی مرورگر واقعی**
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    // ✅ **حرکات موس تصادفی برای جلوگیری از بلاک شدن**
    await page.mouse.move(Math.random() * 800, Math.random() * 600);
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.mouse.click(Math.random() * 800, Math.random() * 600);

    // 📌 **آدرس جستجوی فریلنسرهای Python**
    const searchUrl = 'https://www.upwork.com/nx/search/talent?q=python&page=929';
    console.log('ℹ️ در حال رفتن به صفحه جستجو:', searchUrl);
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

    console.log('✅ صفحه جستجو بارگذاری شد. منتظر بارگذاری نتایج...');

    // ✅ **بررسی تعداد کل صفحات جستجو**
    let totalPages = await page.evaluate(() => {
        let paginationElement = document.querySelector(".air3-pagination-mobile");
        return paginationElement ? parseInt(paginationElement.innerText.trim().replace(",", "").split(" ").slice(-1)[0]) : 1;
    });

    console.log(`📊 تعداد کل صفحات: ${totalPages}`);

    // 📂 **مسیر فایل ذخیره لینک‌ها**
    const filePath = 'data/profiles.json';

    // ✅ **بررسی اگر فایل قبلاً وجود دارد، داده‌های قدیمی را بخوانیم**
    let existingLinks = new Set();
    try {
        if (fs.existsSync(filePath)) {
            const rawData = fs.readFileSync(filePath, 'utf-8');
            existingLinks = new Set(rawData.trim() ? JSON.parse(rawData) : []);
        }
    } catch (error) {
        console.error('❌ خطا در خواندن فایل JSON:', error);
        existingLinks = new Set();
    }

    // 🔄 **پردازش صفحات**
    for (let currentPage = 1; currentPage <= totalPages; currentPage++) {
        console.log(`📄 پردازش صفحه ${currentPage}...`);

        // ✅ **اسکرول صفحه تا انتها برای لود کامل داده‌ها**
        console.log("⏳ در حال اسکرول برای لود تمام پروفایل‌ها...");
        let lastHeight = await page.evaluate(() => document.body.scrollHeight);
        while (true) {
            await page.evaluate(() => window.scrollBy(0, window.innerHeight));
            await new Promise(resolve => setTimeout(resolve, 2000));
            let newHeight = await page.evaluate(() => document.body.scrollHeight);
            if (newHeight === lastHeight) break;
            lastHeight = newHeight;
        }

        // ✅ **انتظار برای بارگذاری لینک‌ها**
        try {
            await page.waitForSelector('h4 a', { timeout: 10000 });
        } catch (error) {
            console.log("🚨 لینک‌های پروفایل پیدا نشدند! احتمالاً صفحه نیاز به بررسی دارد.");
            continue;
        }

        // ✅ **استخراج لینک‌های پروفایل**
        let profileLinks = await page.evaluate(() => {
            return Array.from(document.querySelectorAll("h4 a")).map(link => link.href);
        });

        profileLinks.forEach(link => existingLinks.add(link));

        console.log(`ℹ️ تعداد لینک‌های یکتای استخراج‌شده تا الان: ${existingLinks.size}`);

        // ✅ **ذخیره لینک‌ها در فایل JSON بدون حذف لینک‌های قبلی**
        try {
            fs.mkdirSync('data', { recursive: true });
            fs.writeFileSync(filePath, JSON.stringify([...existingLinks], null, 2));
            console.log(`✅ تعداد لینک‌های ذخیره‌شده در فایل: ${existingLinks.size}`);
        } catch (fileErr) {
            console.error('❌ خطا در ذخیره‌سازی فایل:', fileErr);
        }

        // ✅ **اگر صفحه آخر بود، متوقف شو**
        if (currentPage === totalPages) break;

        // ✅ **کلیک روی دکمه صفحه بعدی**
        console.log(`⏭️ رفتن به صفحه ${currentPage + 1}...`);
        let nextPageButton = await page.$(`div.air3-card-section > nav > ul > li:nth-child(${currentPage < 4 ? 5 + currentPage : 8}) > button`);

        if (!nextPageButton) {
            console.log(`🚨 دکمه صفحه ${currentPage + 1} پیدا نشد!`);
            break;
        }

        await nextPageButton.click();

        // ✅ **صبر برای بارگذاری صفحه جدید**
        await new Promise(resolve => setTimeout(resolve, 12000));

        // ✅ **شبیه‌سازی رفتار انسانی پس از لود صفحه جدید**
        await page.mouse.move(Math.random() * 800, Math.random() * 600);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // **مرورگر را نبند تا اگر کپچا ظاهر شد، دستی حل کنی**
    console.log('🚀 عملیات استخراج به پایان رسید. مرورگر باز خواهد ماند.');
})();
