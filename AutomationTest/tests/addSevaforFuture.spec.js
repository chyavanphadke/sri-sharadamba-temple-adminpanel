const { test, expect } = require('@playwright/test');
const fs = require('fs');

function getNextSaturday() {
  const today = new Date();
  const result = new Date(today);
  result.setDate(today.getDate() + ((6 - today.getDay() + 7) % 7 || 7));
  return result;
}

test.use({
  headless: false,
  viewport: null,
  storageState: 'auth.json',
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized']
  }
});

test('Add Seva for Automation devotee (future) and approve it', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');

  const homeMenuItem = page.locator('li.ant-menu-item-selected:has-text("Home")');
  if (!(await homeMenuItem.isVisible())) {
    await page.getByRole('link', { name: 'Home' }).click();
  }

  const searchBox = page.getByPlaceholder('Search Devotees by Name, Phone, Email or Family Member');
  await expect(searchBox).toBeVisible();
  await searchBox.fill('Automation');

  const row = page.locator('tr:has-text("Automation")');
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'SEVA' }).click();

  await expect(page.locator('.ant-modal-title')).toContainText('Add Seva');

  // Select service category
  await page.locator('#ServiceCategory')
    .locator('xpath=ancestor::div[contains(@class, "ant-select")]//div[contains(@class, "ant-select-selector")]')
    .click();
  const categoryOptions = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const randomCategoryIndex = Math.floor(Math.random() * (await categoryOptions.count()));
  const categoryText = await categoryOptions.nth(randomCategoryIndex).textContent();
  await categoryOptions.nth(randomCategoryIndex).click();

  // Select service
  await page.locator('#Service')
    .locator('xpath=ancestor::div[contains(@class, "ant-select")]//div[contains(@class, "ant-select-selector")]')
    .click();
  const serviceOptions = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const randomServiceIndex = Math.floor(Math.random() * (await serviceOptions.count()));
  const serviceText = (await serviceOptions.nth(randomServiceIndex).textContent()).trim();
  await serviceOptions.nth(randomServiceIndex).click();

  // Amount
  const amountInput = page.locator('#AmountPaid');
  let amount = await amountInput.inputValue();
  if (!amount || amount === '0') {
    amount = String(Math.floor(Math.random() * 90) + 10);
    await amountInput.fill(amount);
  }

  // Payment method
  await page.locator('#PaymentMethod')
    .locator('xpath=ancestor::div[contains(@class, "ant-select")]//div[contains(@class, "ant-select-selector")]')
    .click();
  const payOptions = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const payIndex = Math.floor(Math.random() * (await payOptions.count()));
  const paymentText = (await payOptions.nth(payIndex).textContent()).trim();
  await payOptions.nth(payIndex).click();

  if (paymentText.toLowerCase().includes('check')) {
    const checkNo = String(Math.floor(Math.random() * 9000 + 1000));
    await page.locator('#CheckNumber').fill(checkNo);
  }

  // Service date
  await page.locator('#ServiceDate').click();

  const serviceDateObj = serviceText.includes('Annadanam (Saturday)')
    ? getNextSaturday()
    : (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d; })();

  const serviceDate = serviceDateObj.toISOString().split('T')[0]; // "YYYY-MM-DD"

  let retries = 3;
  while (retries > 0) {
    const cell = page.locator(`.ant-picker-cell[title="${serviceDate}"]`);
    if (await cell.count() > 0) {
      await cell.click();
      break;
    }
    await page.locator('.ant-picker-header-next-btn').click();
    retries--;
  }

  // Comments
  const now = new Date();
  const time = now.toLocaleTimeString('en-GB');
  const date = now.toLocaleDateString('en-GB');
  await page.locator('#Comments').fill(`AutoTest: ${date} ${time}`);

  // Submit
  await page.getByRole('button', { name: 'Add Seva' }).click();

  await expect(page.locator('text=Seva added successfully')).toBeVisible();

  // Save to future-seva.json
  const sevaRecord = {
    date: serviceDate,
    category: categoryText.trim(),
    service: serviceText,
    amount,
    paymentMethod: paymentText === "Check" ? `${paymentText} (${checkNo})` : paymentText
  };
  fs.writeFileSync('future-seva.json', JSON.stringify(sevaRecord, null, 2));
  console.log('📄 Saved future seva:', sevaRecord);

  // === PART 2: Approve the matching receipt ===

  await page.getByRole('link', { name: 'Receipts' }).click();
  await expect(page.locator('table')).toBeVisible();
  await page.waitForTimeout(2000); // Waits for 2 seconds

  // Format "YYYY-MM-DD" → "Mon DD, YYYY"
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const [y, m, d] = sevaRecord.date.split('-').map(Number);
  const tableDate = `${months[m - 1]} ${d}, ${y}`;

  const matchingRows = page.locator(`tr:has(td:has-text("${tableDate}"))`);
  const rowCount = await matchingRows.count();

  let found = false;

  for (let i = 0; i < rowCount; i++) {
    const row = matchingRows.nth(i);

    const service = (await row.locator('td').nth(2).textContent()).trim();
    const payment = (await row.locator('td').nth(5).textContent()).trim();
    const amount = (await row.locator('td').nth(6).textContent()).trim();

    const serviceOK = service.toLowerCase().includes(sevaRecord.service.toLowerCase());
    const paymentOK = payment.toLowerCase() === sevaRecord.paymentMethod.toLowerCase();
    const amountOK = amount === sevaRecord.amount;

    if (serviceOK && paymentOK && amountOK) {
      console.log(`✅ Found row: ${service}, ${payment}, ${amount}`);
      await row.getByRole('button', { name: 'Approve' }).click();
      await expect(page.locator('text=Receipt approved successfully')).toBeVisible();
      found = true;
      break;
    }
  }

  if (!found) {
    throw new Error('❌ No matching receipt row found for approval.');
  }
});