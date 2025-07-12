const { test, expect } = require('@playwright/test');
const fs = require('fs');

test.use({
  trace: 'on',
  headless: false,
  viewport: null, // ← Let browser use full screen size
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized'] // ← Maximizes the window
  },
  storageState: 'auth.json'
});

test('Add new devotee with random email and phone', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/home');

  // Open the "Add Devotee" modal
  await page.getByRole('button', { name: 'Add Devotee' }).click();

  // Wait for modal title to appear
  await expect(page.locator('.ant-modal-title')).toContainText('Add Devotee');

  // Generate random data
  const randomNumber = Math.floor(10000 + Math.random() * 90000);
  const randomEmail = `test${randomNumber}@gmail.com`;
  const randomPhone = `9${Math.floor(100000000 + Math.random() * 900000000)}`;
  const last4 = randomPhone.slice(-4);

  // Fill form fields
  await page.getByPlaceholder('First Name').fill('Test');
  await page.getByPlaceholder('Last Name').fill('User');
  await page.locator('#Phone').fill(randomPhone);
  await page.locator('#AltPhone').fill(`8${randomPhone.slice(1)}`);
  await page.getByPlaceholder('Address').fill('123 Temple Street');
  await page.getByPlaceholder('City').fill('Milpitas');
  await page.getByPlaceholder('State').fill('CA');
  await page.getByPlaceholder('Zip Code').fill('95035');
  await page.getByPlaceholder('Gotra').fill('Vasishta');
  await page.getByPlaceholder('Star').fill('Rohini');
  await page.locator('input#Email[type="search"]').fill(randomEmail);

  // Submit the form
  await page.locator('button[type="submit"]').click();

  // Verify success message
  await expect(page.locator('text=Devotee added')).toBeVisible();

  // Save data to file for delete test
  fs.writeFileSync('latest-devotee.json', JSON.stringify({ email: randomEmail, last4 }));

  console.log(`✅ Added Devotee: ${randomEmail}, Phone: ${randomPhone}`);
});