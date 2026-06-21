/**
 * @file environment.js
 * @description Environment Variable Inspector — displays all environment
 *   variables safely with automatic sensitive-key redaction and
 *   PATH duplicate detection.
 */
import Table from 'cli-table3';
import path from 'path';
import { Logger, Theme } from '../utils/logger.js';

const SENSITIVE = /token|secret|password|passwd|key|api|auth|credential/i;

const PRIORITY_KEYS = [
  'NODE_ENV','PATH','HOME','USER','SHELL','LANG','TERM','EDITOR',
  'LOGNAME','HOSTNAME','COMPUTERNAME','OS','USERPROFILE','APPDATA',
  'WINDIR','TEMP','TMP','npm_config_prefix','NODE_PATH'
];

export default async function showEnvironment() {
  Logger.startSpinner('Inspecting environment variables safely...');
  try {
    const env = process.env;
    const rows = [];

    for (const key of PRIORITY_KEYS) {
      if (key in env) {
        rows.push({
          key,
          value: SENSITIVE.test(key) ? '[REDACTED]' : env[key],
          priority: true
        });
      }
    }
    for (const key of Object.keys(env).sort()) {
      if (PRIORITY_KEYS.includes(key)) continue;
      rows.push({
        key,
        value: SENSITIVE.test(key) ? '[REDACTED]' : env[key],
        priority: false
      });
    }

    const pathVal = env.PATH || env.Path || '';
    const pathEntries = pathVal.split(path.delimiter).filter(Boolean);
    const uniquePaths = new Set(pathEntries);
    const hasDuplicates = pathEntries.length > uniquePaths.size;

    Logger.stopSpinner(true, `${rows.length} environment variables inspected.`);

    console.log('\n' + Theme.secondary.bold('=== ENVIRONMENT VARIABLE INSPECTOR ===') + '\n');
    console.log(Theme.primary.bold('>> SUMMARY'));
    console.log(`  ${Theme.success('Total Variables')}  : ${rows.length}`);
    console.log(`  ${Theme.success('Redacted Keys')}    : ${rows.filter(r => r.value === '[REDACTED]').length}`);
    console.log(`  ${Theme.success('PATH Entries')}     : ${pathEntries.length} (${hasDuplicates ? Theme.warning('⚠ duplicates found') : Theme.success('✔ clean')})`);
    console.log(`  ${Theme.success('NODE_ENV')}         : ${env.NODE_ENV ? Theme.success(env.NODE_ENV) : Theme.warning('not set')}\n`);

    const table = new Table({
      head: [Theme.secondary.bold('Variable'), Theme.secondary.bold('Value')],
      style: { head: [], border: ['gray'] },
      colWidths: [30, 70],
      wordWrap: true,
      chars: {
        'top':'═','top-mid':'╤','top-left':'╔','top-right':'╗',
        'bottom':'═','bottom-mid':'╧','bottom-left':'╚','bottom-right':'╝',
        'left':'║','left-mid':'╟','mid':'─','mid-mid':'┼',
        'right':'║','right-mid':'╢','middle':'│'
      }
    });

    for (const row of rows) {
      const keyStr = row.priority ? Theme.primary(row.key) : row.key;
      const valStr = row.value === '[REDACTED]'
        ? Theme.warning('[REDACTED]')
        : Theme.dim(String(row.value).substring(0, 68));
      table.push([keyStr, valStr]);
    }

    console.log(Theme.primary.bold('>> ALL ENVIRONMENT VARIABLES'));
    console.log(table.toString());

    if (hasDuplicates) {
      console.log('\n' + Theme.warning('⚠  Duplicate PATH entries detected:'));
      const seen = new Set();
      pathEntries.forEach(p => {
        if (seen.has(p)) console.log(Theme.dim(`   Duplicate: ${p}`));
        seen.add(p);
      });
    }
    console.log('\n' + Theme.dim('  Sensitive keys are automatically redacted.') + '\n');
  } catch (err) {
    Logger.stopSpinner(false, 'Environment inspection failed.');
    Logger.error('Failed to inspect environment.', err);
  }
}
