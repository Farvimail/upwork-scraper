const fs = require('fs');

// 📌 **بارگذاری داده‌ها**
const filePath = 'data/freelancer_profiles.json';
const outputPath = 'data/top_words_by_year.json';

if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}`);

// 📌 **تابع برای استخراج سال از متن تاریخ**
function extractYear(dateStr) {
    if (!dateStr) return null;
    let match = dateStr.match(/\b(201[5-9]|202[0-5])\b/);
    return match ? match[0] : null;
}

// 📌 **تابع شمارش پرتکرارترین کلمات**
function getTopWords(titles, topN = 20) {
    let wordCounts = {};
    let stopWords = new Set([
        "the", "and", "for", "with", "to", "in", "on", "of", "a", "an", "at", "by", "is", "from", "as", "this", "that"
    ]);

    titles.forEach(title => {
        title.toLowerCase().split(/\W+/).forEach(word => {
            if (word && !stopWords.has(word)) {
                wordCounts[word] = (wordCounts[word] || 0) + 1;
            }
        });
    });

    return Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, topN)
        .map(([word, count]) => ({ word, count }));
}

// 📌 **ساختار داده برای ذخیره عناوین شغلی بر اساس سال**
let titlesByYear = {
    "Overall": [],
    "2015": [], "2016": [], "2017": [], "2018": [], "2019": [],
    "2020": [], "2021": [], "2022": [], "2023": [], "2024": [], "2025": []
};

// 📌 **جمع‌آوری عناوین پروژه‌ها بر اساس سال**
freelancers.forEach(freelancer => {
    const processJobs = (jobs) => {
        jobs.forEach(job => {
            if (job.title) {
                let year = extractYear(job.date);
                if (year) {
                    titlesByYear[year].push(job.title);
                }
                titlesByYear["Overall"].push(job.title);
            }
        });
    };

    if (freelancer.completed_jobs) processJobs(freelancer.completed_jobs);
    if (freelancer.in_progress_jobs) processJobs(freelancer.in_progress_jobs);
});

// 📌 **تبدیل داده‌ها به پرتکرارترین کلمات**
let finalResult = {};
Object.keys(titlesByYear).forEach(year => {
    finalResult[year] = getTopWords(titlesByYear[year], 20);
});

// 📌 **ذخیره خروجی در `top_words_by_year.json`**
fs.writeFileSync(outputPath, JSON.stringify(finalResult, null, 2));

console.log(`✅ لیست کلمات پرتکرار بر اساس سال‌ها در فایل \`${outputPath}\` ذخیره شد! 🚀`);
