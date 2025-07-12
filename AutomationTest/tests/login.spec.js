const { test, expect, devices } = require('@playwright/test');

test.use({
  headless: false,
  viewport: null, // Important: disables default fixed viewport
  launchOptions: {
    slowMo: 1000,
    args: ['--start-maximized'] // Truly maximizes the OS window
  }
});

test('Login and save storage state', async ({ page, context }) => {
  await page.goto('http://localhost:3000');

  await page.getByPlaceholder('Username or Email').fill('Automation');
  await page.getByPlaceholder('Password').fill('Automation@123');
  await page.getByRole('button', { name: 'Log In' }).click();

  await page.waitForURL('**/dashboard/home', { timeout: 10_000 });
  await expect(page).toHaveURL(/.*dashboard\/home/);

  // Save the authenticated state
  await context.storageState({ path: 'auth.json' });
});
