const fs = require('fs');

const filePath = 'data/freelancer_profiles.json';
const outputPath = 'data/new_freelancers.json';

if (!fs.existsSync(filePath)) {
    console.error("❌ فایل freelancer_profiles.json پیدا نشد!");
    process.exit(1);
}

const freelancers = JSON.parse(fs.readFileSync(filePath));
console.log(`📌 تعداد کل فریلنسرها: ${freelancers.length}`);

const today = new Date();
const twoMonthsAgo = new Date();
const sixMonthsAgo = new Date();
const twelveMonthsAgo = new Date();

twoMonthsAgo.setMonth(today.getMonth() - 2);
sixMonthsAgo.setMonth(today.getMonth() - 6);
twelveMonthsAgo.setMonth(today.getMonth() - 12);

function parseDate(dateStr) {
    if (!dateStr) return null;
    if (!/\b([A-Za-z]+ \d{1,2}, \d{4})\b/.test(dateStr) && !dateStr.includes("Present")) {
        return "INVALID"; 
    }

    let parts = dateStr.split("-").map(part => part.trim());

    if (parts.length === 2) {
        if (parts[1].includes("Present")) {
            let match = parts[0].match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
            return match ? new Date(match[0]) : null;
        }
        let match = parts[1].match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
        return match ? new Date(match[0]) : null;
    }

    let match = dateStr.match(/\b([A-Za-z]+ \d{1,2}, \d{4})\b/);
    return match ? new Date(match[0]) : null;
}

function parseEarnings(earnings) {
    if (!earnings) return 0;
    let match = earnings.match(/\$([\d,]+)K?\+/);
    if (!match) return 0;
    let amount = parseFloat(match[1].replace(/,/g, ''));
    return earnings.includes("K") ? amount * 1000 : amount;
}

function parseProjectPrice(price) {
    if (!price || price === "N/A" || price.toLowerCase().includes("private")) {
        return 0;
    }
    let match = price.match(/\$([\d,]+(\.\d+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
}

const categorizedFreelancers = {
    "2_months": [],
    "6_months": [],
    "12_months": []
};

freelancers.forEach(freelancer => {
    let allJobDates = [];
    let hasInvalidDate = false;
    let hasOldProject = false;
    let totalProjectEarnings = 0;
    let allPrivateEarnings = true;

    [...(freelancer.completed_jobs || []), ...(freelancer.in_progress_jobs || [])].forEach(job => {
        let jobDate = parseDate(job.date);
        let projectPrice = parseProjectPrice(job.price);

        if (jobDate === "INVALID") {
            hasInvalidDate = true;
            return;
        }

        if (jobDate) {
            allJobDates.push(jobDate);
            if (jobDate < twelveMonthsAgo) {
                hasOldProject = true;
            }
        }

        if (projectPrice > 0) {
            allPrivateEarnings = false;
        }

        totalProjectEarnings += projectPrice;
    });

    if (hasInvalidDate || hasOldProject || allJobDates.length === 0) return;

    // مقایسه درآمد پروژه‌ها با total_earnings فریلنسر
    let estimatedTotalEarnings = parseEarnings(freelancer.total_earnings);
    if (estimatedTotalEarnings > 0 && Math.abs(estimatedTotalEarnings - totalProjectEarnings) > 500) {
        return; // اگر اختلاف زیاد بود، حذف شود
    }

    // اگر همه پروژه‌ها private earnings بودند، فریلنسر حذف شود
    if (allPrivateEarnings) return;

    let in2Months = allJobDates.every(date => date >= twoMonthsAgo);
    let in6Months = allJobDates.every(date => date >= sixMonthsAgo);
    let in12Months = allJobDates.every(date => date >= twelveMonthsAgo);

    if (in2Months) {
        categorizedFreelancers["2_months"].push(freelancer);
    } else if (in6Months) {
        categorizedFreelancers["6_months"].push(freelancer);
    } else if (in12Months) {
        categorizedFreelancers["12_months"].push(freelancer);
    }
});

Object.keys(categorizedFreelancers).forEach(category => {
    categorizedFreelancers[category].sort((a, b) => parseEarnings(b.total_earnings) - parseEarnings(a.total_earnings));
});

const finalOutput = {
    summary: {
        "2_months": categorizedFreelancers["2_months"].length,
        "6_months": categorizedFreelancers["6_months"].length,
        "12_months": categorizedFreelancers["12_months"].length
    },
    freelancers: categorizedFreelancers
};

fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2));

console.log(`✅ فریلنسرهای تازه‌وارد واقعی شناسایی شدند و در فایل \`${outputPath}\` ذخیره شدند! 🚀`);
