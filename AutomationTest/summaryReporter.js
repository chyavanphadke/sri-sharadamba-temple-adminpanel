class SummaryReporter {
  constructor() {
    this.results = [];
  }

  onTestEnd(test, result) {
    const fileName = test.titlePath()[1]; // test file name
    const status = result.status === 'passed' ? '✅ Passed' :
                   result.status === 'failed' ? '❌ Failed' :
                   '⚠️  Skipped';
    this.results.push({ name: fileName, status });
  }

  onEnd() {
    console.log('\nTest Name                     | Status');
    console.log('-----------------------------|--------');
    const seen = new Set();
    for (const { name, status } of this.results) {
      if (!seen.has(name)) {
        seen.add(name);
        console.log(`${name.padEnd(29)}| ${status}`);
      }
    }
  }
}

module.exports = SummaryReporter;
