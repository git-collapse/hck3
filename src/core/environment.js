import Table from 'cli-table3';
import { Logger, Theme } from '../utils/logger.js';

export default async function() {
  Logger.startSpinner('Scanning environment variables...');
  
  // Simulate slight delay for UX
  await new Promise(res => setTimeout(res, 300));
  
  Logger.stopSpinner(true, 'Environment scan complete.');

  const table = new Table({
    head: [Theme.secondary.bold('Variable'), Theme.secondary.bold('Value')],
    style: {
      head: [],
      border: ['gray']
    },
    chars: {
      'top': '═', 'top-mid': '╤', 'top-left': '╔', 'top-right': '╗',
      'bottom': '═', 'bottom-mid': '╧', 'bottom-left': '╚', 'bottom-right': '╝',
      'left': '║', 'left-mid': '╟', 'mid': '─', 'mid-mid': '┼',
      'right': '║', 'right-mid': '╢', 'middle': '│'
    }
  });

  const redactionRegex = /token|secret|password|passwd|key|api|auth|credential/i;

  const envKeys = Object.keys(process.env).sort();
  
  let redactedCount = 0;

  for (const key of envKeys) {
    let value = process.env[key];
    
    if (redactionRegex.test(key)) {
      value = Theme.error('[REDACTED]');
      redactedCount++;
    } else {
      // Truncate massively long variables (e.g. LS_COLORS) to keep table clean
      if (value.length > 80) {
        value = value.substring(0, 77) + '...';
      }
      value = Theme.primary(value);
    }

    table.push([Theme.primary.bold(key), value]);
  }

  console.log('\n' + Theme.secondary.bold('=== ENVIRONMENT VARIABLES ===') + '\n');
  console.log(table.toString());
  console.log(`\n${Theme.success(`✔ Displayed ${envKeys.length} environment variables.`)}`);
  console.log(`${Theme.warning(`⚠ Safely redacted ${redactedCount} sensitive variables.`)}\n`);
}
