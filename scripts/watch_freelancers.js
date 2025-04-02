// watch_freelancer.js
const { spawn } = require('child_process');
const path = require('path');

function runScraper() {
  console.log('🚀 اجرای اسکریپر فریلنسرها شروع شد...');

  const scriptPath = path.resolve(__dirname, 'scrape_freelancers_resume.js');
  const scraper = spawn(`node`, [`"${scriptPath}"`], {
    stdio: 'inherit',
    shell: true
  });

  scraper.on('exit', (code) => {
    console.log(`⚠️ اسکریپت با کد ${code} متوقف شد. راه‌اندازی مجدد در ۵ ثانیه...`);
    setTimeout(runScraper, 5000);
  });
}

runScraper();
