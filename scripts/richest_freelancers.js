const fs = require('fs');

// 📌 **مسیر فایل داده‌ها**
const filePath = 'data/freelancer_profiles.json';
const outputPath = 'data/richest_freelancers.json';

// 📌 **بارگذاری داده‌ها**
if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}\n`);

// 📌 **تبدیل درآمد فریلنسرها به مقدار واقعی**
const parseEarnings = (earningStr) => {
    if (!earningStr) return 0;
    let num = parseFloat(earningStr.replace(/[^0-9.]/g, ""));
    if (earningStr.toLowerCase().includes('k')) return num * 1000;
    if (earningStr.toLowerCase().includes('m')) return num * 1000000;
    return num;
};

// 📌 **استخراج پردرآمدترین فریلنسرها**
let richestFreelancers = freelancers
    .filter(freelancer => freelancer.total_earnings)
    .map(freelancer => ({
        name: freelancer.name,
        profile_url: freelancer.profile_url,
        total_earnings: parseEarnings(freelancer.total_earnings)
    }))
    .sort((a, b) => b.total_earnings - a.total_earnings)
    .slice(0, 10);

// **ذخیره اطلاعات در فایل richest_freelancers.json**
fs.writeFileSync(outputPath, JSON.stringify(richestFreelancers, null, 2));

console.log(`✅ اطلاعات پردرآمدترین فریلنسرها در ${outputPath} ذخیره شد.`);
console.log("🔝 ۱۰ فریلنسر پردرآمد:");
console.table(richestFreelancers);
