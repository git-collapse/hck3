/**
 * @file system.js
 * @description System Command Controller
 * @responsibilities Retrieves system information, formats it, and exports visually stunning CLI & files.
 */

import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';
import Table from 'cli-table3';
import { Logger, Theme } from '../utils/logger.js';
import { SystemService } from '../services/systemService.js';
import { formatBytesInMBGB, formatUptime, formatDate, safeValue, generateProgressBar } from '../utils/formatter.js';
import { stripColors } from '../utils/helper.js';

import { createRequire } from 'module';
const _require = createRequire(import.meta.url);
const _pkg = _require('../../package.json');

export default async function(options = {}) {
  const t0 = performance.now();
  if (!options.json) {
    Logger.startSpinner('Gathering comprehensive system metrics...');
  }

  try {
    const info = SystemService.getSystemInfo();
    
    // Compute health
    info.health = SystemService.getHealthSummary(info.memory, info.cpu, info.system, info.node);
    
    const t1 = performance.now();
    const execTimeMs = (t1 - t0).toFixed(2);
    info.executionTimeMs = execTimeMs;

    if (!options.json) {
      Logger.stopSpinner(true, 'System metrics retrieved successfully.');
    }

    // Always generate string report for text saving
    const reportStr = buildCLIReportString(info);

    // Save outputs
    const reportData = saveReportsAutomatically(info, reportStr);

    if (options.json) {
      console.log(JSON.stringify(reportData, null, 2));
    } else {
      console.log(reportStr);
      printFooter(execTimeMs);
    }
  } catch (error) {
    if (!options.json) Logger.stopSpinner(false, 'Failed to gather system information.');
    Logger.error('Error during system information collection.', error);
  }
}

function saveReportsAutomatically(info, reportStr) {
  const reportDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  const reportData = {
    timestamp: new Date().toISOString(),
    version: _pkg.version,
    executionTimeMs: info.executionTimeMs,
    healthSummary: info.health,
    collectedInformation: info
  };

  // Save JSON
  const jsonPath = path.resolve(reportDir, 'system-report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  // Save TXT
  const txtPath = path.resolve(reportDir, 'system-report.txt');
  fs.writeFileSync(txtPath, stripColors(reportStr) + '\n' + stripColors(getFooterString(info.executionTimeMs)));
  
  return reportData;
}

function printFooter(execTimeMs) {
  console.log(getFooterString(execTimeMs));
}

function getFooterString(execTimeMs) {
  const timeStr = new Date().toLocaleString();
  return `
${Theme.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
${Theme.success.bold('Report Generated Successfully')}
${Theme.primary('Execution Time')} : ${execTimeMs} ms
${Theme.primary('Generated At')}   : ${timeStr}
${Theme.secondary(`SysProbe Pro v${_pkg.version}`)}
${Theme.dim('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')}
`;
}

function buildCLIReportString(info) {
  let output = '\n' + Theme.secondary.bold('=== SYSTEM INFORMATION REPORT ===') + '\n\n';

  // General Section
  const genTable = createTable(['Property', 'Value']);
  const gen = info.general;
  genTable.push(
    ['OS Name', Theme.primary(safeValue(gen.osName))],
    ['OS Release', safeValue(gen.osRelease)],
    ['OS Version', safeValue(gen.osVersion)],
    ['Platform', safeValue(gen.platform)],
    ['Architecture', safeValue(gen.architecture)],
    ['Hostname', Theme.secondary(safeValue(gen.hostname))],
    ['Current User', safeValue(gen.currentUser)],
    ['Home Directory', safeValue(gen.homeDirectory)],
    ['Temp Directory', safeValue(gen.tempDirectory)],
    ['Process ID', String(safeValue(gen.pid))]
  );
  output += Theme.primary.bold('>> GENERAL') + '\n';
  output += genTable.toString() + '\n\n';

  // CPU Section
  const cpuTable = createTable(['Property', 'Value']);
  const cpu = info.cpu;
  cpuTable.push(
    ['CPU Model', Theme.primary(safeValue(cpu.model))],
    ['CPU Cores', `${cpu.count} logical threads`],
    ['Architecture', safeValue(cpu.architecture)],
    ['Speed (MHz)', safeValue(cpu.speed)],
    ['Load Average', safeValue(cpu.loadAverage)]
  );
  output += Theme.primary.bold('>> CPU') + '\n';
  output += cpuTable.toString() + '\n\n';

  // Memory Section
  const memTable = createTable(['Property', 'Value']);
  const mem = info.memory;
  const memBarColor = mem.usagePercent > 85 ? Theme.error : (mem.usagePercent > 60 ? Theme.warning : Theme.success);
  const memBar = memBarColor(generateProgressBar(mem.usagePercent, 20));
  
  memTable.push(
    ['RAM Usage', `${memBar}  ${Theme.bold(mem.usagePercent + '%')}`],
    ['Used RAM', `${formatBytesInMBGB(mem.used)} (${mem.usagePercent}%)`],
    ['Free RAM', `${formatBytesInMBGB(mem.free)} (${mem.freePercent}%)`],
    ['Total RAM', formatBytesInMBGB(mem.total)]
  );
  output += Theme.primary.bold('>> MEMORY') + '\n';
  output += memTable.toString() + '\n\n';

  // Network Section
  const netTable = createTable(['Interface', 'Family', 'Address', 'Internal', 'MAC']);
  info.network.forEach(net => {
    netTable.push([
      Theme.secondary(safeValue(net.interface)),
      safeValue(net.family),
      Theme.primary(safeValue(net.address)),
      net.internal ? Theme.warning('Yes') : Theme.success('No'),
      safeValue(net.mac)
    ]);
  });
  output += Theme.primary.bold('>> NETWORK') + '\n';
  output += netTable.toString() + '\n\n';

  // Node Runtime Section
  const nodeTable = createTable(['Property', 'Value']);
  const node = info.node;
  nodeTable.push(
    ['Node Version', Theme.success(safeValue(node.nodeVersion))],
    ['V8 Version', safeValue(node.v8Version)],
    ['Process Arch', safeValue(node.processArch)],
    ['Platform', safeValue(node.platform)]
  );
  output += Theme.primary.bold('>> NODE RUNTIME') + '\n';
  output += nodeTable.toString() + '\n\n';

  // Health Summary Section
  const health = info.health;
  let healthColor = Theme.success;
  if (health.rating === 'Average') healthColor = Theme.warning;
  if (health.rating === 'Needs Attention') healthColor = Theme.error;

  const healthTable = createTable(['Metric', 'Details']);
  healthTable.push(
    ['Health Score', healthColor.bold(health.score)],
    ['Status', healthColor(health.rating)],
    ['Reason', Theme.dim(health.explanation)]
  );
  output += Theme.primary.bold('>> HEALTH SUMMARY') + '\n';
  output += healthTable.toString() + '\n';

  // Environment Variables Section
  const SENSITIVE = /token|secret|password|passwd|key|api|auth|credential/i;
  const ENV_KEYS = [
    'NODE_ENV', 'PATH', 'HOME', 'USER', 'SHELL', 'LANG', 'TERM',
    'HOSTNAME', 'COMPUTERNAME', 'OS', 'USERPROFILE', 'APPDATA', 'TEMP', 'TMP'
  ];
  const envTable = createTable(['Variable', 'Value']);
  for (const key of ENV_KEYS) {
    if (!(key in process.env)) continue;
    let val = process.env[key];
    if (SENSITIVE.test(key)) {
      val = '[REDACTED]';
    } else if (key === 'PATH') {
      val = val.length > 80 ? val.substring(0, 80) + '...' : val;
    }
    envTable.push([
      Theme.primary(key),
      SENSITIVE.test(key) ? Theme.warning(val) : Theme.dim(val)
    ]);
  }
  output += Theme.primary.bold('>> ENVIRONMENT (SELECTED)') + '\n';
  output += envTable.toString() + '\n';
  output += Theme.dim('  Sensitive keys are automatically redacted.') + '\n';

  return output;
}

function createTable(head) {
  return new Table({
    head: head.map(h => Theme.secondary.bold(h)),
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
}
