const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching browser to capture screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // 1. Capture React Main CRUD View
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  const shot1 = path.resolve(__dirname, '../screenshots/01_react_student_list_crud.png');
  await page.screenshot({ path: shot1, fullPage: true });
  console.log('Captured:', shot1);

  // 2. Capture React Add Form with Data Filled
  await page.type('input[name="name"]', 'Deepak Verma');
  await page.type('input[name="email"]', 'deepak@campus.edu');
  await page.type('input[name="course"]', 'Cloud Computing');
  const semInput = await page.$('input[name="semester"]');
  await semInput.click({ clickCount: 3 });
  await semInput.type('6');
  const shot2 = path.resolve(__dirname, '../screenshots/02_react_add_student_form.png');
  await page.screenshot({ path: shot2, fullPage: true });
  console.log('Captured:', shot2);

  // Submit and capture newly added student
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1500));
  const shot3 = path.resolve(__dirname, '../screenshots/03_react_student_added_live.png');
  await page.screenshot({ path: shot3, fullPage: true });
  console.log('Captured:', shot3);

  // 3. Capture Swagger OpenAPI Documentation
  await page.goto('http://localhost:3000/api-docs', { waitUntil: 'networkidle0' });
  const shot4 = path.resolve(__dirname, '../screenshots/04_swagger_openapi_docs.png');
  await page.screenshot({ path: shot4, fullPage: true });
  console.log('Captured:', shot4);

  // 4. Capture Negative Validation Test (HTTP 400 Bad Request)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('input[name="name"]', 'Invalid Student');
  await page.type('input[name="email"]', 'invalid-email-format');
  await page.type('input[name="course"]', 'IT');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 500));
  const shot5 = path.resolve(__dirname, '../screenshots/05_react_validation_error_400.png');
  await page.screenshot({ path: shot5, fullPage: true });
  console.log('Captured:', shot5);

  await browser.close();
  console.log('ALL_SCREENSHOTS_CAPTURED_SUCCESSFULLY');
})();
