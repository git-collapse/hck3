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

export default async function(options = {}) {
  const t0 = performance.now();
  Logger.startSpinner('Gathering comprehensive system metrics...');

  try {
    const info = SystemService.getSystemInfo();
    
    // Compute health
    info.health = SystemService.getHealthSummary(info.memory, info.cpu, info.system, info.node);
    
    const t1 = performance.now();
    const execTimeMs = (t1 - t0).toFixed(2);
    info.executionTimeMs = execTimeMs;

    Logger.stopSpinner(true, 'System metrics retrieved successfully.');

    // Always generate string report for text saving
    const reportStr = buildCLIReportString(info);

    // Save outputs
    saveReportsAutomatically(info, reportStr);

    if (!options.json) {
      console.log(reportStr);
      printFooter(execTimeMs);
    }
  } catch (error) {
    Logger.stopSpinner(false, 'Failed to gather system information.');
    Logger.error('Error during system information collection.', error);
  }
}

function saveReportsAutomatically(info, reportStr) {
  const reportDir = path.resolve(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // Save JSON
  const jsonPath = path.resolve(reportDir, 'system-report.json');
  const reportData = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    executionTimeMs: info.executionTimeMs,
    healthSummary: info.health,
    collectedInformation: info
  };
  fs.writeFileSync(jsonPath, JSON.stringify(reportData, null, 2));

  // Save TXT
  const txtPath = path.resolve(reportDir, 'system-report.txt');
  fs.writeFileSync(txtPath, stripColors(reportStr) + '\n' + stripColors(getFooterString(info.executionTimeMs)));
  
  Logger.info(`Reports automatically saved to ${Theme.dim('reports/')}`);
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
${Theme.secondary('SysProbe Pro v1.0.0')}
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
    ['Current Working Dir', safeValue(gen.cwd)],
    ['Node.js Version', Theme.success(safeValue(gen.nodeVersion))]
  );
  output += Theme.primary.bold('>> GENERAL') + '\n';
  output += genTable.toString() + '\n\n';

  // CPU Section
  const cpuTable = createTable(['Property', 'Value']);
  const cpu = info.cpu;
  const cpuBar = generateProgressBar(100, 15); // Static bar just for visual flair of cores
  cpuTable.push(
    ['CPU Model', Theme.primary(safeValue(cpu.model))],
    ['CPU Cores', `${cpu.count} (Logical Threads) ${Theme.dim(cpuBar)}`],
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
