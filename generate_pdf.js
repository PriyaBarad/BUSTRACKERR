const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Install puppeteer if not present
try {
  require('puppeteer');
  console.log('puppeteer already installed');
} catch (e) {
  console.log('Installing puppeteer...');
  execSync('npm install puppeteer', { stdio: 'inherit', cwd: __dirname });
}

const puppeteer = require('puppeteer');

(async () => {
  const htmlPath = path.resolve(__dirname, 'diagram.html');
  const pdfPath = path.resolve(__dirname, 'BUSTRACKERR_Architecture_Diagram.pdf');

  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-web-security']
  });

  const page = await browser.newPage();
  
  // Set viewport to A3 landscape size
  await page.setViewport({ width: 1414, height: 1000, deviceScaleFactor: 2 });
  
  console.log('Loading HTML file...');
  await page.goto(`file:///${htmlPath.replace(/\\/g, '/')}`, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for Google Fonts to load
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Generating PDF...');
  await page.pdf({
    path: pdfPath,
    width: '420mm',
    height: '297mm',
    landscape: false,
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });

  await browser.close();
  
  const stat = fs.statSync(pdfPath);
  console.log(`PDF generated successfully! Size: ${(stat.size / 1024).toFixed(1)} KB`);
  console.log(`Saved to: ${pdfPath}`);
})();
