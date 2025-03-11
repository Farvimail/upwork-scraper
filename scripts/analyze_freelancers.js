const fs = require('fs');

// 📌 **مسیر فایل داده‌ها**
const filePath = 'data/freelancer_profiles.json';

// 📌 **بارگذاری داده‌ها**
if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}\n`);

// 📌 **۱. استخراج پروژه‌های in_progress در سال 2025**
const inProgress2025 = freelancers.flatMap(freelancer => 
    freelancer.in_progress_jobs.filter(job => job.date.includes("2025"))
);

// 📌 **۲. محاسبه میانگین تعداد پروژه‌های in_progress برای هر فریلنسر**
const avgInProgress = freelancers.reduce((sum, freelancer) => 
    sum + freelancer.in_progress_jobs.length, 0) / freelancers.length;

// 📌 **۳. تحلیل اولین پروژه‌های فریلنسرها**
let firstProjects = freelancers
    .map(freelancer => freelancer.completed_jobs[0])
    .filter(job => job && job.title !== "N/A");

let firstProjectTitles = {};
let firstProjectEarnings = 0;

firstProjects.forEach(job => {
    firstProjectTitles[job.title] = (firstProjectTitles[job.title] || 0) + 1;
    let price = parseFloat(job.price.replace(/[^0-9.]/g, "")) || 0;
    firstProjectEarnings += price;
});

let avgFirstProjectEarnings = (firstProjectEarnings / firstProjects.length).toFixed(2);

// 📌 **۴. تحلیل ترند پروژه‌ها در هر سال از 2015 تا 2025**
let trendsPerYear = {};

freelancers.forEach(freelancer => {
    freelancer.completed_jobs.forEach(job => {
        let year = job.date.match(/\b(201[5-9]|202[0-5])\b/);
        if (year) {
            let y = year[0];
            trendsPerYear[y] = trendsPerYear[y] || {};
            trendsPerYear[y][job.title] = (trendsPerYear[y][job.title] || 0) + 1;
        }
    });
});

// 📌 **۵. تحلیل درآمد مهارت‌ها و پروژه‌ها**
let skillEarnings = {};
let projectEarnings = {};

freelancers.forEach(freelancer => {
    freelancer.completed_jobs.forEach(job => {
        let price = parseFloat(job.price.replace(/[^0-9.]/g, "")) || 0;

        // محاسبه درآمد بر اساس نام پروژه
        projectEarnings[job.title] = (projectEarnings[job.title] || 0) + price;

        // محاسبه درآمد بر اساس مهارت‌های فریلنسر
        freelancer.skills.forEach(skill => {
            skillEarnings[skill] = (skillEarnings[skill] || 0) + price;
        });
    });
});

// **دریافت ۱۰ مهارت پردرآمد**
let topSkills = Object.entries(skillEarnings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

// **دریافت ۱۰ پروژه پردرآمد**
let topProjects = Object.entries(projectEarnings)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

// 📌 **ذخیره داده‌ها در فایل analyze_freelancers.json**
const analysisResults = {
    "in_progress_2025": inProgress2025,
    "avg_in_progress": avgInProgress.toFixed(2),
    "first_projects": {
        "titles": firstProjectTitles,
        "avg_earnings": avgFirstProjectEarnings
    },
    "trending_projects": trendsPerYear,
    "top_skills": topSkills,
    "top_earning_projects": topProjects
};

fs.writeFileSync('data/analyze_freelancers.json', JSON.stringify(analysisResults, null, 2));

console.log("✅ تحلیل داده‌ها در فایل 'data/analyze_freelancers.json' ذخیره شد!");
