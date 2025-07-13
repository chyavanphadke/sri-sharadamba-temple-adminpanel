const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,

  // 👇 Run in the exact order by listing test files
  projects: [
    {
      name: 'sequential-tests',
      testMatch: [
        'tests/login.spec.js',
        'tests/addDevotee.spec.js',
        'tests/deleteDevotee.spec.js',
        'tests/addSevaforToday.spec.js',
        'tests/addSevaforFuture.spec.js',
        'tests/excelSheetSeva.spec.js'
      ]
    }
  ],

  // 👇 Run using only one worker
  workers: 1,

  // 👇 Custom reporters
  reporter: [
    ['dot'],
    ['./summaryReporter.js']
  ],
});
