import { test, expect } from '@playwright/test';
import fs from 'fs';

test.use({
  trace: 'on',
  headless: false,
  viewport: null,                     // let the window decide its own size
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized']       // open the OS-level window maximized
  },
  storageState: 'auth.json',
});

test('Delete devotee by verifying both email (search) and phone (match)', async ({ page }) => {
  const { email, last4 } = JSON.parse(fs.readFileSync('latest-devotee.json', 'utf8'));

  await page.goto('http://localhost:3000/dashboard/home');

  // Search using the full email
  await page.getByRole('textbox', { name: 'Search Devotees by Name,' }).fill(email);

  // Wait for the row that contains the last-4 phone digits
  const row = page.locator(`tr:has-text("${last4}")`);
  await expect(row).toBeVisible();

  // Delete that specific row
  await row.getByRole('button', { name: 'Delete' }).click();

  // Confirm modal
  await page.getByRole('button', { name: 'OK' }).click();

  // Verify the row is gone
  await expect(row).toHaveCount(0);

  console.log(`🗑️ Deleted devotee with email ${email} (phone ••••${last4})`);
});