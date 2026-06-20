/**
 * @file helper.js
 * @description Utility Functions
 * @responsibilities Provides common UI helpers like application banners.
 */

import figlet from 'figlet';
import boxen from 'boxen';
import { Theme } from './logger.js';
import fs from 'fs';
import path from 'path';

import os from 'os';

export function displayBanner() {
  const packagePath = path.resolve(process.cwd(), 'package.json');
  let pkg = { version: 'Unknown' };
  try {
    pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  } catch(e) {}

  const logo = figlet.textSync('SysProbe Pro', { font: 'Standard' });
  const time = new Date().toLocaleTimeString();
  const execTime = (process.uptime() * 1000).toFixed(2);
  const reportId = `REP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  
  const info = `${Theme.success('▶ Platform:')} ${os.type()} ${os.release()} | ${Theme.success('▶ Node.js:')} ${process.version}
${Theme.dim('Version:')} ${pkg.version} | ${Theme.dim('Execution Time:')} ${execTime} ms
${Theme.warning('Report ID:')} ${reportId}`;
  
  const content = `${Theme.primary(logo)}\n\n${info}`;
  
  const box = boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    align: 'center'
  });
  
  console.log(box);
  return reportId;
}

/**
 * Generates a professional CLI string without color formatting, useful for plain text saves.
 */
export function stripColors(str) {
  // Simple regex to strip ANSI escape codes
  return str.replace(/\x1B\[\d+m/g, '');
}
