#!/usr/bin/env node
/**
 * Post coverage results as a PR comment
 * Reads coverage/coverage-summary.json and posts formatted results to GitHub PR
 */

const fs = require('fs');
const path = require('path');

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const root = process.cwd();
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');

const data = readJson(summaryPath);

if (!data) {
  console.error('Coverage summary not found at coverage/coverage-summary.json');
  process.exit(1);
}

const totals = data.total || data;

const formatCoverage = (pct) => {
  const num = typeof pct === 'number' ? pct : 0;
  const color = num >= 90 ? '🟢' : num >= 80 ? '🟡' : '🔴';
  return `${color} ${num.toFixed(1)}%`;
};

const comment = `## 📊 Code Coverage Report

| Metric | Coverage | Status |
|--------|----------|--------|
| **Statements** | ${formatCoverage(totals.statements?.pct)} | ${totals.statements?.pct >= 90 ? '✅' : '❌'} |
| **Branches** | ${formatCoverage(totals.branches?.pct)} | ${totals.branches?.pct >= 90 ? '✅' : '❌'} |
| **Functions** | ${formatCoverage(totals.functions?.pct)} | ${totals.functions?.pct >= 90 ? '✅' : '❌'} |
| **Lines** | ${formatCoverage(totals.lines?.pct)} | ${totals.lines?.pct >= 90 ? '✅' : '❌'} |

**Minimum Required:** 90% for all metrics

${totals.statements?.pct >= 90 && totals.branches?.pct >= 90 && totals.functions?.pct >= 90 && totals.lines?.pct >= 90
  ? '🎉 All coverage requirements met!'
  : '⚠️ Some metrics are below the 90% requirement.'
}`;

console.log(comment);