const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// 📌 Stealth دستی
const applyStealth = async (page) => {
    await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => false });
    });
};

// 📌 مسیر state برای resume
const statePath = path.join('data', 'freelancer_state.json');

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
    await applyStealth(page);

    // 📌 **لود کردن کوکی‌ها برای ورود خودکار**
    const cookiesPath = 'data/cookies.json';
    if (fs.existsSync(cookiesPath)) {
        console.log("🍪 بارگذاری کوکی‌ها...");
        const cookies = JSON.parse(fs.readFileSync(cookiesPath));
        await page.setCookie(...cookies);
    }

    // ✅ **انتخاب User-Agent تصادفی**
    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36",
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
    ];
    await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);

    // ✅ **بارگذاری لیست پروفایل‌ها**
    const profilesPath = 'data/uiux_profiles.json';
    if (!fs.existsSync(profilesPath)) {
        console.error("❌ فایل uiux_profiles.json پیدا نشد!");
        await browser.close();
        return;
    }

    const profiles = JSON.parse(fs.readFileSync(profilesPath));
    console.log(`📌 تعداد پروفایل‌ها برای پردازش: ${profiles.length}`);

    let freelancerData = [];
    let startIndex = 0;
    if (fs.existsSync(statePath)) {
        try {
            const state = JSON.parse(fs.readFileSync(statePath));
            startIndex = state.lastIndex || 0;
        } catch {}
    }

    for (let i = startIndex; i < profiles.length; i++) {
        const profileUrl = profiles[i];
        console.log(`🔎 در حال پردازش پروفایل: ${profileUrl}`);

        try {
            await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

            // ✅ **انتظار برای بارگذاری اطلاعات پروفایل**
            await page.waitForSelector("h2[itemprop='name']", { timeout: 20000 });

            // ✅ **استخراج اطلاعات پروفایل**
            const profileInfo = await page.evaluate(() => {
                const getText = (selector) => document.querySelector(selector)?.innerText.trim() || "N/A";
                const getList = (selector) => Array.from(document.querySelectorAll(selector)).map(el => el.innerText.trim());

                return {
                    name: getText("h2[itemprop='name']"),
                    title: getText("span[data-v-015e54d8]"),
                    location: `${getText("span[itemprop='locality']")}, ${getText("span[itemprop='country-name']")}`,
                    job_success_score: getText("span[data-v-015e54d8]"),
                    total_earnings: getText(".stat-amount.h5"),
                    total_jobs: getText(".col-compact:nth-child(2) .stat-amount.h5"),
                    experience: "N/A",
                    skills: getList("ul[data-v-47a0ced8]"),
                    profile_overview: getText('section[data-test="freelancer_overview"]'),
                    profile_url: window.location.href
                };
            });

            console.log(`✅ اطلاعات استخراج‌شده: ${profileInfo.name} | ${profileInfo.title}`);
            console.log(`📌 مهارت‌ها: ${profileInfo.skills.length > 0 ? profileInfo.skills.join(", ") : "مهارتی یافت نشد."}`);

            // ✅ **استخراج تمام پروژه‌های Completed Jobs و In-Progress Jobs**
            let jobs = {
                completed_jobs: [],
                in_progress_jobs: []
            };
            let jobs_list = ["jobs_completed_desktop", "jobs_in_progress_desktop"];
            let turn = 0; // شروع از Completed Jobs

            while (turn < jobs_list.length) {
                let currentPage = 1;

                while (true) {
                    console.log(`📄 پردازش صفحه ${currentPage} از ${jobs_list[turn]} ...`);

                    try {
                        await page.waitForSelector(`#${jobs_list[turn]} .assignments-item`, { timeout: 5000 });

                        let jobsOnPage = await page.evaluate((sectionId) => {
                            let jobElements = document.querySelectorAll(`#${sectionId} .assignments-item`);
                            return Array.from(jobElements).map(job => ({
                                title: job.querySelector("h5 a")?.innerText.trim() || "N/A",
                                date: job.querySelector(".d-flex.align-items-center > span > span")?.innerText.trim() || "N/A",
                                rating: job.querySelector(".d-flex.align-items-center > strong")?.innerText.trim() || "N/A",
                                description: job.querySelector("[id^='air3-truncation'], .text-pre-line")?.innerText.trim() || "N/A",
                                price: job.querySelector(".air3-grid-container.text-light-on-inverse.text-base.mt-6x > div:nth-child(1) > strong")?.innerText.trim() || "N/A",
                                link: job.querySelector("h5 a")?.href.trim() || "N/A"
                            }));
                        }, jobs_list[turn]);

                        jobs[turn === 0 ? "completed_jobs" : "in_progress_jobs"].push(...jobsOnPage);
                        console.log(`✅ تعداد پروژه‌های استخراج‌شده تا الان: ${jobs.completed_jobs.length + jobs.in_progress_jobs.length}`);
                    } catch (err) {
                        console.log(`🚨 خطا در استخراج اطلاعات صفحه ${currentPage} پروژه‌های ${jobs_list[turn]}.`);
                    }

                    // ✅ **بررسی اینکه آیا به صفحه‌ی آخر رسیدیم یا نه**
                    let activeButton = await page.$(`#${jobs_list[turn]} > div.text-right > div > nav > ul > li > button.is-active`);
                    let activePageNumber = activeButton
                        ? parseInt(await page.evaluate(el => el.innerText.split(" ").slice(-1)[0].trim(), activeButton))
                        : null;

                    if (activePageNumber && currentPage === activePageNumber) {
                        console.log("✅ آخرین صفحه‌ی واقعی تشخیص داده شد، متوقف شد!");
                        break;
                    }

                    // ✅ **بررسی دکمه‌ی صفحه بعدی**
                    let nextPageSelector;
                    if (currentPage < 4) {
                        nextPageSelector = `#${jobs_list[turn]} > div.text-right > div > nav > ul > li:nth-child(${5 + currentPage}) > button`;
                    } else {
                        nextPageSelector = `#${jobs_list[turn]} > div.text-right > div > nav > ul > li:nth-child(8) > button`;
                    }

                    let nextPageButton = await page.$(nextPageSelector);

                    if (!nextPageButton) {
                        console.log(`✅ به آخرین صفحه پروژه‌های ${jobs_list[turn]} رسیدیم.`);
                        break;
                    }

                    console.log(`⏭️ رفتن به صفحه بعدی (${currentPage + 1}) از پروژه‌های ${jobs_list[turn]} ...`);
                    await nextPageButton.evaluate(el => el.click());
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    currentPage++;
                }

                turn++;
            }

            profileInfo.completed_jobs = jobs.completed_jobs;
            profileInfo.in_progress_jobs = jobs.in_progress_jobs;
            freelancerData.push(profileInfo);

            // ✅ **ذخیره اطلاعات در `freelancer_profiles.json`**
            let filePath = 'data/react_freelancer_profiles.json';
            let existingData = [];

            if (fs.existsSync(filePath)) {
                try {
                    existingData = JSON.parse(fs.readFileSync(filePath));
                } catch (error) {
                    console.error("⚠️ خطا در خواندن فایل JSON، ایجاد فایل جدید.");
                    existingData = [];
                }
            }

            fs.writeFileSync(filePath, JSON.stringify([...existingData, profileInfo], null, 2));

            console.log(`✅ اطلاعات فریلنسر ${profileInfo.name} ذخیره شد!`);
            fs.writeFileSync(statePath, JSON.stringify({ lastIndex: i + 1 }, null, 2));
        } catch (err) {
            console.log(`❌ خطا در پردازش پروفایل ${profileUrl}:`, err);
        }
    }

    console.log("🚀 عملیات استخراج تمام شد!");
    await browser.close();
})();