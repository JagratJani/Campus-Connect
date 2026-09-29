const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Capturing comprehensive full-cycle CRUD screenshots...');
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 950 });

  // Auto accept confirm dialogs for Delete
  page.on('dialog', async dialog => {
    console.log('Accepting dialog:', dialog.message());
    await dialog.accept();
  });

  const shotsDir = path.resolve(__dirname, '../screenshots');

  // 1. Initial State: List all students
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(shotsDir, '01_initial_student_list.png'), fullPage: true });
  console.log('1. Captured initial student list');

  // 2. Add Student: Form Filled
  await page.type('input[name="name"]', 'Rohan Sharma');
  await page.type('input[name="email"]', 'rohan.sharma@campus.edu');
  await page.type('input[name="course"]', 'Artificial Intelligence');
  const semInput = await page.$('input[name="semester"]');
  await semInput.click({ clickCount: 3 });
  await semInput.type('5');
  await page.screenshot({ path: path.join(shotsDir, '02_add_student_form_filled.png'), fullPage: true });
  console.log('2. Captured add student form filled');

  // 3. Add Student: Submitted & Toast Message Visible
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(shotsDir, '03_student_added_success.png'), fullPage: true });
  console.log('3. Captured student added success with toast');

  // 4. Edit Student: Click Edit button on newly added student
  const editButtons = await page.$$('.btn-edit');
  if (editButtons.length > 0) {
    await editButtons[editButtons.length - 1].click();
    await new Promise(r => setTimeout(r, 600));
    await page.screenshot({ path: path.join(shotsDir, '04_edit_student_form_populated.png'), fullPage: true });
    console.log('4. Captured edit student form populated with data');

    // Modify course and semester
    const courseInput = await page.$('input[name="course"]');
    await courseInput.click({ clickCount: 3 });
    await courseInput.type('Robotics & AI');
    const semInputEdit = await page.$('input[name="semester"]');
    await semInputEdit.click({ clickCount: 3 });
    await semInputEdit.type('6');
    await page.screenshot({ path: path.join(shotsDir, '05_edit_student_modified_data.png'), fullPage: true });
    console.log('5. Captured edited data before update');

    // Submit Edit
    await page.click('button[type="submit"]');
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(shotsDir, '06_student_updated_success.png'), fullPage: true });
    console.log('6. Captured student updated success with toast');
  }

  // 5. Delete Student: Click Delete on student
  const deleteButtons = await page.$$('.btn-danger');
  if (deleteButtons.length > 0) {
    await deleteButtons[deleteButtons.length - 1].click();
    await new Promise(r => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(shotsDir, '07_student_deleted_success.png'), fullPage: true });
    console.log('7. Captured student deleted success state');
  }

  // 6. Validation Error: Invalid Email Test (HTTP 400)
  await page.type('input[name="name"]', 'Test Student');
  await page.type('input[name="email"]', 'invalid_email_format');
  await page.type('input[name="course"]', 'CSE');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(shotsDir, '08_validation_error_client.png'), fullPage: true });
  console.log('8. Captured client validation error');

  // 7. Duplicate Email Test (Backend HTTP 400 Bad Request)
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
  await page.type('input[name="name"]', 'Jagrat Duplicate');
  await page.type('input[name="email"]', 'jagrat@campus.edu');
  await page.type('input[name="course"]', 'CSE');
  await page.click('button[type="submit"]');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(shotsDir, '09_validation_error_duplicate_email_400.png'), fullPage: true });
  console.log('9. Captured backend duplicate email error 400');

  // 8. Swagger OpenAPI 3.0 Documentation Screen
  await page.goto('http://localhost:3000/api-docs', { waitUntil: 'networkidle0' });
  await page.screenshot({ path: path.join(shotsDir, '10_swagger_openapi_full_docs.png'), fullPage: true });
  console.log('10. Captured Swagger OpenAPI Docs');

  await browser.close();
  console.log('ALL_STEP_BY_STEP_SCREENSHOTS_CAPTURED');
})();
