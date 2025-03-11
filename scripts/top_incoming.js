const fs = require('fs');

const filePath = 'data/freelancer_profiles.json';
if (!fs.existsSync(filePath)) {
    console.error("❌ فایل داده پیدا نشد!");
    process.exit(1);
}

const freelancers = JSON.parse(fs.readFileSync(filePath));

let projectData = {};

// **تعریف کلمات کلیدی برای دسته‌بندی خودکار**
const categoryMapping = [
    { category: "AI & Data Science", keywords: ["AI", "Machine Learning", "Deep Learning", "Data Science", "Neural Network", "ML", "Computer Vision"] },
    { category: "Web Development", keywords: ["Web Development", "React", "Vue", "Angular", "HTML", "CSS", "JavaScript"] },
    { category: "Software Development", keywords: ["Python", "Java", "C++", "C#", "Software Engineering", "App Development"] },
    { category: "Data Analytics & BI", keywords: ["Power BI", "Dashboard", "Data Analytics", "ETL", "Data Engineer", "Excel"] },
    { category: "Cloud Computing", keywords: ["AWS", "Google Cloud", "Azure", "Cloud", "DevOps", "Kubernetes"] },
    { category: "Cybersecurity", keywords: ["Security", "Pentest", "Penetration Testing", "Cybersecurity", "Ethical Hacking"] },
    { category: "Embedded Systems", keywords: ["Embedded", "Arduino", "ESP32", "IoT", "Microcontroller", "Hardware Design"] },
    { category: "Blockchain & Crypto", keywords: ["Blockchain", "Crypto", "Smart Contract", "Ethereum", "Solana", "NFT"] },
    { category: "UI/UX & Design", keywords: ["UI/UX", "Figma", "Photoshop", "Graphic Design", "Product Design"] }
];

freelancers.forEach(freelancer => {
    freelancer.completed_jobs.forEach(job => {
        let price = parseFloat(job.price.replace(/[^0-9.]/g, "")) || 0;
        let category = job.category || "Unknown";

        // **اگر `category` مقدار `Unknown` دارد، یک دسته‌ی خودکار براساس `title` تعیین کنیم**
        if (category === "Unknown" || !category) {
            for (let cat of categoryMapping) {
                if (cat.keywords.some(keyword => job.title.includes(keyword))) {
                    category = cat.category;
                    break;
                }
            }
        }

        if (!projectData[job.title]) {
            projectData[job.title] = { earnings: 0, category: category };
        }

        projectData[job.title].earnings += price;
    });
});

// **مرتب‌سازی و انتخاب ۱۰ پروژه پردرآمد**
let topProjects = Object.entries(projectData)
    .sort((a, b) => b[1].earnings - a[1].earnings)
    .slice(0, 10)
    .map(([title, data]) => ({
        title,
        earnings: data.earnings,
        category: data.category
    }));

// **ذخیره داده‌ها در فایل JSON**
fs.writeFileSync('data/top_incoming.json', JSON.stringify({ topProjects }, null, 2));

console.log("✅ تحلیل داده‌ها کامل شد و در analyze_freelancers.json ذخیره شد.");
