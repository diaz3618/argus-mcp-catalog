#!/usr/bin/env node
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT        = path.resolve(__dirname, '..');
const CONFIGS_DIR = path.join(ROOT, 'configs');
const OUTPUT_PATH = path.join(ROOT, 'catalog.json');

const categories = {};

for (const entry of fs.readdirSync(CONFIGS_DIR, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const category = entry.name;
  const categoryDir = path.join(CONFIGS_DIR, category);
  const files = fs.readdirSync(categoryDir)
    .filter(f => f.endsWith('.yaml'))
    .sort();
  if (files.length > 0) {
    categories[category] = files;
  }
}

const catalog = {
  categories,
  updated_at: new Date().toISOString(),
};

fs.writeFileSync(OUTPUT_PATH, JSON.stringify(catalog, null, 2) + '\n');
console.log(
  `Generated catalog.json: ${Object.keys(categories).length} categories, ` +
  Object.values(categories).reduce((n, v) => n + v.length, 0) + ' files.'
);
