/**
 * @file doctor.js
 * @description Doctor Command Controller
 * @responsibilities Executes System Intelligence Engine diagnostics and displays visually rich CLI reports.
 */

import { performance } from 'perf_hooks';
import Table from 'cli-table3';
import { DoctorService } from '../services/doctorService.js';
import { Logger, Theme } from '../utils/logger.js';
import { generateProgressBar } from '../utils/formatter.js';

export default async function(options = {}) {
  const t0 = performance.now();
  Logger.startSpinner('Running intelligence diagnostics...');

  try {
    const diagnostics = DoctorService.runDiagnostics();
    const t1 = performance.now();
    const execTime = (t1 - t0).toFixed(2);

    Logger.stopSpinner(true, `Diagnostics completed in ${execTime}ms.`);
    displayDoctorReport(diagnostics);

  } catch (err) {
    Logger.stopSpinner(false, 'Diagnostic engine encountered an error.');
    Logger.error('Failed to run doctor command.', err);
  }
}

function displayDoctorReport(diag) {
  console.log('\n' + Theme.secondary.bold('=== SYSTEM INTELLIGENCE REPORT ===') + '\n');
  
  // Health Score Box
  const gradeColor = getGradeColor(diag.grade);
  const scoreBox = new Table({
    style: { border: ['gray'] },
    colWidths: [20, 40]
  });
  
  // Visual progress bar for score
  const scoreBar = generateProgressBar(diag.score, 20);
  
  scoreBox.push(
    [Theme.primary.bold('Health Score'), gradeColor.bold(`${diag.score} / 100`) + '\n' + gradeColor(scoreBar)],
    [Theme.primary.bold('Overall Grade'), gradeColor.bold(diag.grade)]
  );
  console.log(scoreBox.toString() + '\n');

  // Print sections
  printSection('CPU Analysis', diag.cpu);
  printSection('Memory Analysis', diag.memory);
  printSection('Node.js Runtime', diag.node);
  printSection('Environment Variables', diag.environment);
  printSection('Disk Status', diag.disk);

  // Recommendations
  console.log(Theme.primary.bold('>> INTELLIGENT RECOMMENDATIONS'));
  const recTable = new Table({
    style: { border: ['gray'] }
  });
  
  if (diag.recommendations.length > 0) {
    diag.recommendations.forEach((rec, idx) => {
      recTable.push([Theme.secondary(`${idx + 1}.`), Theme.warning(rec)]);
    });
  } else {
    recTable.push(['✔', Theme.success('System is fully optimized. No recommendations at this time.')]);
  }
  console.log(recTable.toString() + '\n');
}

function printSection(title, data) {
  console.log(Theme.primary.bold(`>> ${title.toUpperCase()}`));
  const table = new Table({
    style: { border: ['gray'] },
    colWidths: [20, 50],
    wordWrap: true
  });
  
  table.push(
    ['Detected Value', safeTheme(Theme.primary)(data.detected)],
    ['Health Status', getGradeColor(data.status).bold(data.status)],
    ['Reason', Theme.dim(data.reason)]
  );
  if (data.recommendation) {
    table.push(['Recommendation', Theme.warning(data.recommendation)]);
  }
  
  console.log(table.toString() + '\n');
}

function safeTheme(themeFn) {
  return (val) => val ? themeFn(val) : '';
}

function getGradeColor(grade) {
  switch(grade.toLowerCase()) {
    case 'excellent': return Theme.success;
    case 'good': return Theme.success;
    case 'average': return Theme.warning;
    case 'warning': return Theme.warning;
    case 'poor': return Theme.error;
    case 'critical': return Theme.error;
    case 'info': return Theme.secondary;
    default: return Theme.dim;
  }
}
