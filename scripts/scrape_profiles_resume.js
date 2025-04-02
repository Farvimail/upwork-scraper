// ✅ نسخه نهایی با قابلیت ادامه (resume)، stealth، اسکرول، حرکت موس و فرم جستجو

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const statePath = path.join(__dirname, '../data/scraper_state.json');
const outputPath = path.join(__dirname, '../data/uiux_profiles.json');

const applyStealth = async (page) => {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
  });
};

(async () => {
  let startPage = 440;
  let existingLinks = new Set();

  if (fs.existsSync(statePath)) {
    try {
      const stateData = JSON.parse(fs.readFileSync(statePath, 'utf-8'));
      startPage = stateData.last_success_page || 1;
    } catch (err) {
      console.error('❌ خطا در خواندن فایل وضعیت:', err);
    }
  }

  if (fs.existsSync(outputPath)) {
    try {
      const rawData = fs.readFileSync(outputPath, 'utf-8');
      existingLinks = new Set(rawData.trim() ? JSON.parse(rawData) : []);
    } catch (err) {
      console.error('❌ خطا در خواندن لینک‌های قبلی:', err);
    }
  }

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();
  await applyStealth(page);

  const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
  ];
  await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

  await page.mouse.move(Math.random() * 800, Math.random() * 600);
  await new Promise(resolve => setTimeout(resolve, 2000));

  const searchUrl = `https://www.upwork.com/nx/search/talent/?nbs=1&q=react&page=${startPage}`;
  console.log('ℹ️ در حال رفتن به صفحه جستجو:', searchUrl);
  await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
  await new Promise(resolve => setTimeout(resolve, 4000));

//   // 🧠 فرم جستجوی UI/UX
//   const input = await page.$("#navSearchForm-desktop > div.nav-search-input-container > input.nav-search-autosuggest-input");
//   if (input) {
//     await input.click({ clickCount: 3 });
//     await input.type("ui ux", { delay: 100 });
//   }

//   await page.mouse.move(Math.random() * 800, Math.random() * 600);

//   const dropdownButton = await page.$("#navSearchForm-desktop > div.nav-search-dropdown-container > button");
//   if (dropdownButton) {
//     await dropdownButton.click();
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }

//   await page.mouse.move(Math.random() * 800, Math.random() * 600);

//   const firstOption = await page.$("#navSearchForm-desktop > div.nav-search-dropdown-container > ul > li:nth-child(2) > button");
//   if (firstOption) {
//     await firstOption.click();
//     await new Promise(resolve => setTimeout(resolve, 1000));
//   }

//   await page.mouse.move(Math.random() * 800, Math.random() * 600);

//   const searchForm = await page.$("#navSearchForm-desktop");
//   if (searchForm) {
//     await searchForm.evaluate(form => form.submit());
//   }

//   await page.mouse.move(Math.random() * 800, Math.random() * 600);
//   await new Promise(resolve => setTimeout(resolve, 10000));

  console.log('✅ صفحه جستجو بارگذاری شد. منتظر بارگذاری نتایج...');

  let totalPages = await page.evaluate(() => {
    let paginationElement = document.querySelector(".air3-pagination-mobile");
    return paginationElement ? parseInt(paginationElement.innerText.trim().replace(",", "").split(" ").slice(-1)[0]) : 1;
  });

  console.log(`📊 تعداد کل صفحات: ${totalPages}`);

  for (let currentPage = startPage; currentPage <= totalPages; currentPage++) {
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
      break;
    }

    let profileLinks = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("h4 a"))
        .map(link => link.href)
        .filter(href => href.includes("/freelancers/"));
    });

    if (!profileLinks || profileLinks.length === 0) {
      console.warn(`🚫 هیچ لینکی در صفحه ${currentPage} پیدا نشد. متوقف شد.`);
      break;
    }

    profileLinks.forEach(link => existingLinks.add(link));
    console.log(`✅ ${profileLinks.length} لینک در صفحه ${currentPage} ذخیره شد.`);

    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify([...existingLinks], null, 2));
    fs.writeFileSync(statePath, JSON.stringify({ last_success_page: currentPage }, null, 2));

    if (currentPage === totalPages) break;

    console.log(`⏭️ رفتن به صفحه ${currentPage + 1}...`);
    const nextUrl = `https://www.upwork.com/nx/search/talent/?nbs=1&q=react&page=${currentPage + 1}`;
    await page.goto(nextUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await new Promise(resolve => setTimeout(resolve, 10000));
    await page.mouse.move(Math.random() * 800, Math.random() * 600);
  }

  console.log('🚀 عملیات تموم شد. مرورگر باز می‌مونه برای بررسی دستی.');
})();