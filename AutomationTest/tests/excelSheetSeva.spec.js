const { test, expect } = require('@playwright/test');
const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const SHEET_ID = '15O8K9dOeXkeYdMUJBkLGPengqvHzYNt12evv-RbKJeQ';
const RANGE = 'Sheet1!A1';
const OUTPUT_FILE = path.join(__dirname, '..', 'excel-seva.json');

function getRandomDate() {
  const today    = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const picked = Math.random() < 0.5 ? today : tomorrow;

  // ➜ "06/10/2025" with a leading apostrophe
  const mmddyyyy = picked.toLocaleDateString(
    'en-US',
    { month: '2-digit', day: '2-digit', year: 'numeric' }
  );

  return `${mmddyyyy}`;               // note the leading apostrophe
}

function getRandomPaymentOption() {
  return Math.random() < 0.5 ? 'Paid' : 'To be Paid';
}

function generateRandomRow() {
  return [
    '',
    '',
    'Automation',
    'Testing',
    'cpmundaje@gmail.com',
    '1111111111',
    getRandomDate(),
    'Auto-generated entry',
    Math.floor(Math.random() * 90) + 10,
    getRandomPaymentOption(),
    'N/A'
  ];
}

async function getAuthSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: path.join(__dirname, 'service-account.json'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

test.use({
  headless: false,
  storageState: 'auth.json',
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized'], 
  },
  viewport: null 
});


test('Add entries to Google Sheet, sync with UI, validate fetch', async ({ page }) => {
  const sheets = await getAuthSheetsClient();

  const numberOfEntries = Math.floor(Math.random() * 4) + 5;
  const rows = Array.from({ length: numberOfEntries }, generateRandomRow);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: RANGE,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    resource: { values: rows },
  });

  console.log(`✅ Added ${numberOfEntries} row(s) to the sheet.`);

  // Save to excel-seva.json
  const formattedRows = rows.map(row => ({
    name: row[2] + ' ' + row[3],
    email: row[4],
    phone: row[5],
    date: row[6],
    notes: row[7],
    amount: row[8],
    paymentStatus: row[9]
  }));

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedRows, null, 2));
  console.log('📁 Saved entries to excel-seva.json');

  // Now go to the dashboard and trigger fetch
  await page.goto('http://localhost:3000/dashboard/home');
  await page.getByRole('link', { name: 'Excel Data' }).click();
  await page.getByRole('button', { name: 'Fetch Data from Sheets' }).click();

  const successText = `${numberOfEntries} new entries fetched`;
  await expect(page.locator(`text=${successText}`)).toBeVisible();

  // Count payment types
  const paidCount = formattedRows.filter(row => row.paymentStatus === 'Paid').length;
  const toBePaidCount = formattedRows.filter(row => row.paymentStatus === 'To be Paid').length;

  // Final output
  console.log('\n🧾 Summary Report:');
  console.log(`Total number of entries added to the Sheets: ${numberOfEntries}`);
  console.log(`Entries with Payment Option | radio-1 = To be Paid: ${toBePaidCount}`);
  console.log(`Entries with Payment Option | radio-1 = Paid: ${paidCount}`);

  // ========== 4 · Confirm the first X “To be Paid” rows ==========
// ========== 4 · Confirm the first X “To be Paid” rows ==========

// All rows whose payment-status cell currently shows “To be Paid”
const unpaidRows = page.locator('tbody tr:has(td:text-is("To be Paid"))');

// Decide how many we’ll act on
const totalUnpaid = await unpaidRows.count();
const confirmLimit = Math.min(toBePaidCount, totalUnpaid);

for (let i = 0; i < confirmLimit; i++) {
  const row = unpaidRows.nth(0);

  // ❶ click the "Confirm Payment" button inside this row
  await row.getByRole('button', { name: 'Confirm Payment' }).click();

  // ❷ wait for the modal to appear
  const modal = page.locator('.ant-modal-content:has(.ant-modal-title:has-text("Enter Amount"))');
  await modal.waitFor({ state: 'visible' });

  // (Optional) interact with amount / payment-method here …

  // ❸ click OK in the modal
  await modal.getByRole('button', { name: /^OK$/ }).click();

  // ❹ wait for modal to close
  await modal.waitFor({ state: 'hidden' });

  // ❺ confirm the row’s Payment Status cell now reads "Paid"
  //await expect(row.locator('td').nth(9)).toHaveText(/^Paid$/i, { timeout: 5_000 });
}

console.log(`💸 Marked ${confirmLimit} payment(s) as Paid via UI`);
// Go to the Receipts tab
await page.getByRole('link', { name: 'Receipts' }).click();



// 👇 NEW — define the table-row locator and wait for at least one row
const receiptsTableRows = page.locator('.ant-table-row');
await expect(receiptsTableRows.first()).toBeVisible();

// 📁 Load excel-seva.json (same folder the test writes to)
const excelData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf-8'));

// excelData is an array in your script (you saved `formattedRows`), so:
const addedAmounts = excelData
  .map(r => Number(r.amount ?? r['Suggested Donation']))
  .filter(n => !isNaN(n));                 // keep valid numbers

// Top-X rows to compare
const rowCount = await receiptsTableRows.count();
const topRows = Math.min(rowCount, addedAmounts.length);

const tableAmounts = [];
for (let i = 0; i < topRows; i++) {
  const row = receiptsTableRows.nth(i);
  const amountText = await row.locator('td').nth(6).textContent(); // 7-th col = Amount
  tableAmounts.push(parseInt(amountText.trim(), 10));
}

// Assert every expected amount appears in the top-X UI rows
const missing = addedAmounts.filter(a => !tableAmounts.includes(a));
if (missing.length) {
  throw new Error(`❌ Missing Suggested Donations in Receipts table: ${missing.join(', ')}`);
}
console.log('✅ All recently added entries exist in Receipts table!');


});
