#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// 检查是否已构建
const distPath = path.join(__dirname, '..', 'dist', 'index.js');
if (!fs.existsSync(distPath)) {
  console.error('❌ CLI not built. Please run: npm run build');
  process.exit(1);
}

require(distPath);
