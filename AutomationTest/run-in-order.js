const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const testFilesInOrder = [
  'tests/login.spec.js',
  'tests/addDevotee.spec.js',
  'tests/deleteDevotee.spec.js',
  'tests/addSevaforToday.spec.js',
  'tests/addSevaforFuture.spec.js',
  'tests/excelSheetSeva.spec.js',
];

(async () => {
  const chalk = await import('chalk');
  const results = [];

  for (const file of testFilesInOrder) {
    console.log(`\n🔹 Running: ${file}`);
    try {
      execSync(`npx playwright test ${file} --workers=1`, { stdio: 'inherit' });
      results.push({ file, status: chalk.default.green('✅ Passed') });
    } catch {
      results.push({ file, status: chalk.default.red('❌ Failed') });
    }
  }

  console.log('\n📊 Test Summary:\n' + '─'.repeat(40));
  for (const { file, status } of results) {
    const paddedName = file.padEnd(25);
    console.log(`${paddedName} | ${status}`);
  }
})();
