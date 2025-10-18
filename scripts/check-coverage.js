#!/usr/bin/env node
/**
 * Simple coverage gate for CI. Reads coverage/coverage-summary.json (or coverage-final.json)
 * and enforces a minimum global coverage percentage for lines, functions, branches, and statements.
 *
 * Usage: node scripts/check-coverage.js [threshold]
 * Default threshold is 90.
 */

const fs = require('fs');
const path = require('path');

const threshold = Number(process.argv[2] || 90);
const branchThreshold = Number(process.argv[3] || 80);
const functionThreshold = Number(process.argv[4] || 85);

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch (e) {
    return null;
  }
}

const root = process.cwd();
const summaryPath = path.join(root, 'coverage', 'coverage-summary.json');
const fallbackPath = path.join(root, 'coverage', 'coverage-final.json');

const data = readJson(summaryPath) || readJson(fallbackPath);

if (!data) {
  console.error('Coverage summary not found. Expected coverage/coverage-summary.json or coverage/coverage-final.json');
  process.exit(2);
}

// jest json-summary format may nest totals under 'total' or be a flat map for coverage-final
const totals = data.total || data;
const metrics = {
  lines: totals.lines?.pct,
  statements: totals.statements?.pct,
  functions: totals.functions?.pct,
  branches: totals.branches?.pct,
};

const failed = Object.entries(metrics)
  .filter(([key, pct]) => {
    if (typeof pct !== 'number') return false;
    switch (key) {
      case 'branches':
        return pct < branchThreshold;
      case 'functions':
        return pct < functionThreshold;
      default:
        return pct < threshold;
    }
  });

if (failed.length > 0) {
  console.error(`Coverage check failed. Minimum required: statements ${threshold}%, branches ${branchThreshold}%, functions ${functionThreshold}%`);
  for (const [k, pct] of failed) {
    const required = k === 'branches' ? branchThreshold : k === 'functions' ? functionThreshold : threshold;
    console.error(` - ${k}: ${pct}% (required: ${required}%)`);
  }
  process.exit(1);
}

console.log(`Coverage check passed. Statements >= ${threshold}%, branches >= ${branchThreshold}%, functions >= ${functionThreshold}%`);
