// watch_scraper.js
// اجرای دوباره اسکریپت در صورت توقف یا خطا

const { spawn } = require('child_process');

function runScraper() {
  console.log('🚀 اجرای اسکریپر شروع شد...');
  const scraper = spawn('node', ['scrape_profiles_resume.js'], {
    stdio: 'inherit',
    shell: true // برای پشتیبانی بهتر از Windows
  });

  scraper.on('exit', (code) => {
    console.log(`⚠️ اسکریپت با کد ${code} متوقف شد. راه‌اندازی مجدد در ۵ ثانیه...`);
    setTimeout(runScraper, 5000);
  });
}

runScraper();
