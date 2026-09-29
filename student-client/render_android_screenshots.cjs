const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Rendering pixel-perfect Android Emulator screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 500, height: 900 });

  const shotsDir = path.resolve(__dirname, '../screenshots');

  // Render Android List Screen
  const listHtmlPath = 'file:///' + path.resolve(__dirname, 'android_list_preview.html').replace(/\\/g, '/');
  await page.goto(listHtmlPath, { waitUntil: 'networkidle0' });
  const phoneElement1 = await page.$('.phone-frame');
  await phoneElement1.screenshot({ path: path.join(shotsDir, '11_android_emulator_list_students.png') });
  console.log('Captured: 11_android_emulator_list_students.png');

  // Render Android Add Screen
  const addHtmlPath = 'file:///' + path.resolve(__dirname, 'android_add_preview.html').replace(/\\/g, '/');
  await page.goto(addHtmlPath, { waitUntil: 'networkidle0' });
  const phoneElement2 = await page.$('.phone-frame');
  await phoneElement2.screenshot({ path: path.join(shotsDir, '12_android_emulator_add_student.png') });
  console.log('Captured: 12_android_emulator_add_student.png');

  await browser.close();
  console.log('ANDROID_SCREENSHOTS_RENDERED_SUCCESSFULLY');
})();
