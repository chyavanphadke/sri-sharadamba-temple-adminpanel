// tests/addSeva.spec.js
import { test, expect } from '@playwright/test';
import fs from 'fs';

test.use({
  headless: false,
  viewport: null,
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized']
  },
  storageState: 'auth.json'
});

test('Add Seva for Automation devotee and save details', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard');

  /* ---------- Ensure Home tab ---------- */
  if (!(await page.locator('li.ant-menu-item-selected:has-text("Home")').isVisible())) {
    await page.getByRole('link', { name: 'Home' }).click();
  }

  /* ---------- Search devotee ---------- */
  const searchBox = page.getByPlaceholder('Search Devotees by Name, Phone, Email or Family Member');
  await expect(searchBox).toBeVisible();
  await searchBox.fill('Automation');

  const row = page.locator('tr:has-text("Automation")');
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'SEVA' }).click();

  /* ---------- Modal open ---------- */
  await expect(page.locator('.ant-modal-title')).toHaveText(/Add Seva/);

  /* ---------- Service Category (random) ---------- */
  await page
    .locator('#ServiceCategory')
    .locator('xpath=ancestor::div[contains(@class,"ant-select")]//div[contains(@class,"ant-select-selector")]')
    .click();
  const categories = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const catIdx = Math.floor(Math.random() * (await categories.count()));
  const serviceCategory = await categories.nth(catIdx).textContent();
  await categories.nth(catIdx).click();

  /* ---------- Service (random except Annadanam Saturday) ---------- */
  await page
    .locator('#Service')
    .locator('xpath=ancestor::div[contains(@class,"ant-select")]//div[contains(@class,"ant-select-selector")]')
    .click();
  const services = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  let serviceName = '';
  while (true) {
    const idx = Math.floor(Math.random() * (await services.count()));
    const txt = (await services.nth(idx).textContent()).trim();
    if (!txt.includes('Annadanam (Saturday)')) {
      serviceName = txt;
      await services.nth(idx).click();
      break;
    }
  }

  /* ---------- Amount ---------- */
  const amountInput = page.locator('#AmountPaid');
  let amount = await amountInput.inputValue();
  if (!amount || amount === '0') {
    amount = String(Math.floor(Math.random() * 90) + 10);
    await amountInput.fill(amount);
  }

  /* ---------- Payment Method (random) ---------- */
  await page
    .locator('#PaymentMethod')
    .locator('xpath=ancestor::div[contains(@class,"ant-select")]//div[contains(@class,"ant-select-selector")]')
    .click();
  const payOpts = page.locator('.ant-select-dropdown:not(.ant-select-dropdown-hidden) .ant-select-item-option');
  const payIdx = Math.floor(Math.random() * (await payOpts.count()));
  const payText = (await payOpts.nth(payIdx).textContent()).trim();
  await payOpts.nth(payIdx).click();

  if (payText.toLowerCase().includes('check')) {
    await page.locator('#CheckNumber').fill(String(Math.floor(Math.random() * 9000 + 1000)));
  }

  /* ---------- Service Date: today ---------- */
  await page.locator('#ServiceDate').click();
  await page.locator('.ant-picker-cell-today').click();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  /* ---------- Comments ---------- */
  const now = new Date();
  await page
    .locator('#Comments')
    .fill(`AutoTest: ${now.toLocaleDateString('en-GB')} ${now.toLocaleTimeString('en-GB')}`);

  /* ---------- Submit ---------- */
  await page.getByRole('button', { name: 'Add Seva' }).click();

// ---------- Verify & SAVE DATA ----------
await expect(page.locator('text=Seva added successfully')).toBeVisible();

const sevaRecord = {
  date: today,                       // YYYY-MM-DD
  category: serviceCategory.trim(),
  service: serviceName,
  amount: amount,
  paymentMethod: payText
};
fs.writeFileSync('todays-seva.json', JSON.stringify(sevaRecord, null, 2));
console.log('📄 Saved today\'s seva:', sevaRecord);

/* =========================================================================
   ===  PART 2: Approve the matching receipt in the  “Receipts”  tab    ===
   ========================================================================= */
// Navigate to "Receipts" tab
await page.getByRole('link', { name: 'Receipts' }).click();
await expect(page.locator('table')).toBeVisible();

// // Format "2025-07-12" → "Jul 12, 2025"
// const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// const [y, m, d] = sevaRecord.date.split('-').map(Number);
// const tableDate = `${months[m - 1]} ${d}, ${y}`;

// // Filter rows by Service Date
// const matchingRows = page.locator(`tr:has(td:has-text("${tableDate}"))`);
// const count = await matchingRows.count();

// Look through all table rows (skip filtering by date)
const matchingRows = page.locator('table tbody tr');
const count = await matchingRows.count();


let found = false;

for (let i = 0; i < count; i++) {
  const row = matchingRows.nth(i);

  const service = (await row.locator('td').nth(2).textContent()).trim();
  const payment = (await row.locator('td').nth(5).textContent()).trim();
  const amount = (await row.locator('td').nth(6).textContent()).trim();

  const serviceOK = service.toLowerCase().includes(sevaRecord.service.toLowerCase());
  const paymentOK = payment.toLowerCase() === sevaRecord.paymentMethod.toLowerCase();
  const amountOK = amount === sevaRecord.amount;

  if (serviceOK && paymentOK && amountOK) {
    console.log(`✅ Found matching row: ${service}, ${payment}, ${amount}`);
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