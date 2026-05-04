const puppeteer = require('puppeteer-core');

(async () => {
  try {
    const browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
      headless: "new"
    });
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
    
    console.log("Navigating to page...");
    await page.goto('http://localhost:5174/sorting/counting', {waitUntil: 'networkidle2'});
    
    console.log("Clicking play button...");
    // Assuming there's a button with an icon or text indicating "Play"
    // In ControlPanel it usually is a button with a Play icon. Let's find a button containing "Play" or having a specific class.
    // If not, we will just evaluate the logic to click the button.
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const playBtn = buttons.find(b => b.innerHTML.includes('lucide-play') || b.textContent.includes('Play'));
      if (playBtn) playBtn.click();
      else console.log("Play button not found.");
    });
    
    await new Promise(r => setTimeout(r, 2000));
    console.log("Done.");
    await browser.close();
  } catch (err) {
    console.error("SCRIPT ERROR:", err);
  }
})();
