const fs = require('fs');

// 📌 **مسیر فایل داده‌ها**
const filePath = 'data/freelancer_profiles.json';
const outputPath = 'data/new_freelancers.json';

// 📌 **بررسی موجود بودن فایل**
if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

// 📌 **بارگذاری داده‌ها**
const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}`);

// 📌 **تاریخ امروز و ۶ ماه پیش**
const today = new Date();
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(today.getMonth() - 6);

// 📌 **تابع تبدیل تاریخ متنی به Date**
function parseDate(dateStr) {
    if (!dateStr) return null;
    let match = dateStr.match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
    return match ? new Date(match[1]) : null;
}

// 📌 **تابع تبدیل درآمد دارای K و M به عدد صحیح**
function convertEarnings(earningStr) {
    if (!earningStr) return 0;
    earningStr = earningStr.toUpperCase().replace(/[^0-9KM.]/g, "");
    if (earningStr.includes("M")) {
        return parseFloat(earningStr.replace("M", "")) * 1000000;
    } else if (earningStr.includes("K")) {
        return parseFloat(earningStr.replace("K", "")) * 1000;
    } else {
        return parseFloat(earningStr) || 0;
    }
}

// 📌 **فیلتر فریلنسرهای جدید (کمتر از ۶ ماه فعالیت)**
const newFreelancers = freelancers.filter(freelancer => {
    let allJobDates = [];

    [...(freelancer.completed_jobs || []), ...(freelancer.in_progress_jobs || [])].forEach(job => {
        let jobDate = parseDate(job.date);
        if (jobDate) allJobDates.push(jobDate);
    });

    if (allJobDates.length === 0) return false;

    let firstJobDate = new Date(Math.min(...allJobDates.map(d => d.getTime())));
    return firstJobDate >= sixMonthsAgo;
});

// 📌 **ایجاد بخش چکیده**
const summary = newFreelancers.map(freelancer => {
    let totalEarnings = convertEarnings(freelancer.total_earnings);
    let totalProjects = (freelancer.completed_jobs ? freelancer.completed_jobs.length : 0) +
                        (freelancer.in_progress_jobs ? freelancer.in_progress_jobs.length : 0);

    return {
        name: freelancer.name,
        profile_url: freelancer.profile_url,
        total_earnings: totalEarnings,
        total_projects: totalProjects,
        skills: freelancer.skills.length > 0 ? freelancer.skills : ["Unknown"]
    };
}).sort((a, b) => b.total_earnings - a.total_earnings); // **مرتب‌سازی بر اساس درآمد کل**

// 📌 **ایجاد خروجی JSON**
const finalOutput = {
    summary: summary,
    freelancers: newFreelancers
};

// 📌 **ذخیره خروجی در فایل `new_freelancers.json`**
fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));

console.log(`✅ لیست فریلنسرهای جدید به همراه چکیده در فایل \`${outputPath}\` ذخیره شد! 🚀`);
