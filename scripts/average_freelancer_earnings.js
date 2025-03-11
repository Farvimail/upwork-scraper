const fs = require('fs');

// 📌 مسیر فایل داده‌ها
const filePath = 'data/freelancer_profiles.json';

// 📌 بررسی وجود فایل
if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

// 📌 بارگذاری داده‌ها
const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}\n`);

// 📌 ذخیره درآمد در هر سال
let yearlyEarnings = {};

// 📌 مقداردهی اولیه سال‌ها
for (let year = 2015; year <= 2025; year++) {
    yearlyEarnings[year] = { totalEarnings: 0, freelancerCount: 0, inProgressEarnings: 0 };
}

// 📌 پردازش اطلاعات فریلنسرها
freelancers.forEach(freelancer => {
    let yearlyIncome = {}; // نگه‌داری درآمد سالانه هر فریلنسر

    // بررسی پروژه‌های کامل شده
    freelancer.completed_jobs.forEach(job => {
        let yearMatch = job.date.match(/\b(201[5-9]|202[0-5])\b/);
        if (yearMatch) {
            let year = yearMatch[0];

            // **تبدیل درآمد به عدد صحیح**
            let earnings = parseFloat(job.price.replace(/[^0-9.km]/g, ""));
            if (job.price.includes("k")) earnings *= 1000;
            if (job.price.includes("m")) earnings *= 1000000;

            if (!isNaN(earnings) && earnings > 0) {
                yearlyEarnings[year].totalEarnings += earnings;
                
                // فقط یکبار فریلنسر را در آن سال بشماریم
                if (!yearlyIncome[year]) {
                    yearlyIncome[year] = true;
                    yearlyEarnings[year].freelancerCount += 1;
                }
            }
        }
    });

    // بررسی پروژه‌های در حال انجام برای 2025
    freelancer.in_progress_jobs.forEach(job => {
        if (job.date.includes("2025")) {
            let earnings = parseFloat(job.price.replace(/[^0-9.km]/g, ""));
            if (job.price.includes("k")) earnings *= 1000;
            if (job.price.includes("m")) earnings *= 1000000;

            if (!isNaN(earnings) && earnings > 0) {
                yearlyEarnings[2025].inProgressEarnings += earnings;
            }
        }
    });
});

// 📌 محاسبه میانگین درآمد سالانه برای هر فریلنسر
Object.keys(yearlyEarnings).forEach(year => {
    let count = yearlyEarnings[year].freelancerCount;
    let total = yearlyEarnings[year].totalEarnings;

    yearlyEarnings[year].averageEarningsPerFreelancer = count > 0 ? (total / count).toFixed(2) : 0;
});

// 📌 ذخیره اطلاعات در فایل JSON
const outputPath = 'data/average_freelancer_earnings.json';
fs.writeFileSync(outputPath, JSON.stringify(yearlyEarnings, null, 2));

console.log(`✅ اطلاعات میانگین درآمد فریلنسرها ذخیره شد: ${outputPath}`);
