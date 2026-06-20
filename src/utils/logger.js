/**
 * @file logger.js
 * @description Application Logging Utilities
 * @responsibilities Provides formatted logging to console and files. Manages CLI spinners.
 * @future Integrate external log aggregation.
 */

import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

const logDir = path.resolve(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.resolve(logDir, 'app.log');

export const Theme = {
  primary: chalk.cyan,
  secondary: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  dim: chalk.gray,
  bold: chalk.bold
};

export class Logger {
  static spinner = null;

  static startSpinner(text) {
    if (this.spinner) this.spinner.stop();
    this.spinner = ora({ text, color: 'cyan' }).start();
  }

  static stopSpinner(success = true, text = '') {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(Theme.success(text || this.spinner.text));
      } else {
        this.spinner.fail(Theme.error(text || this.spinner.text));
      }
      this.spinner = null;
    }
  }

  static info(message) {
    console.log(Theme.secondary(`ℹ ${message}`));
    this.appendLog('INFO', message);
  }

  static success(message) {
    console.log(Theme.success(`✔ ${message}`));
    this.appendLog('SUCCESS', message);
  }

  static warn(message) {
    console.log(Theme.warning(`⚠ ${message}`));
    this.appendLog('WARN', message);
  }

  static error(message, err = null) {
    console.log(Theme.error(`✖ ${message}`));
    if (err && process.env.DEBUG) {
      console.error(Theme.dim(err.stack));
    }
    this.appendLog('ERROR', `${message} ${err ? err.message : ''}`);
  }

  static appendLog(level, message) {
    try {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] [${level}] ${message}\n`;
      fs.appendFileSync(logFile, logEntry);
    } catch (e) {
      // Ignore logging errors
    }
  }
}
