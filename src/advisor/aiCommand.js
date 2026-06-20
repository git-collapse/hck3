/**
 * @file aiCommand.js
 * @description CLI orchestrator for the offline AI System Advisor.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { SystemService } from '../services/systemService.js';
import { QualityAnalyzer } from '../analyzers/qualityAnalyzer.js';
import { DependencyAnalyzer } from '../analyzers/dependencyAnalyzer.js';
import { SecurityAnalyzer } from '../analyzers/securityAnalyzer.js';
import { KnowledgeEngine } from './knowledgeEngine.js';
import { AiRenderer } from './aiRenderer.js';
import { Logger } from '../utils/logger.js';

export default async function runAiAdvisor() {
  Logger.startSpinner('Gathering system and project telemetry for AI analysis...');

  // 1. Hardware Metrics
  const systemInfo = SystemService.getSystemInfo();
  
  // 2. Process List (approximate top 10)
  let processes = [];
  try {
    if (process.platform === 'win32') {
      const out = execSync('tasklist /FO CSV /NH', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = out.split('\n').filter(l => l.trim().length > 0);
      processes = lines.map(l => {
        const parts = l.split('","').map(p => p.replace(/"/g, ''));
        if (parts.length >= 5) {
          const memStr = parts[4].replace(/[^0-9]/g, '');
          return { name: parts[0], pid: parts[1], memKB: parseInt(memStr, 10) || 0 };
        }
        return null;
      }).filter(Boolean);
      processes.sort((a, b) => b.memKB - a.memKB);
      processes = processes.slice(0, 10);
    } else {
      const out = execSync('ps -eo pid,comm,%mem --sort=-%mem | head -n 11', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = out.split('\n').slice(1).filter(l => l.trim().length > 0);
      processes = lines.map(l => {
        const parts = l.trim().split(/\s+/);
        return { pid: parts[0], name: parts[1] };
      });
    }
  } catch (e) { }

  // 3. Disk Space via fs
  let disk = { usagePercent: 0 };
  try {
    if (fs.statfsSync) {
      const stat = fs.statfsSync(process.cwd());
      const total = stat.blocks * stat.bsize;
      const free = stat.bavail * stat.bsize;
      disk.usagePercent = total > 0 ? parseFloat((((total - free) / total) * 100).toFixed(2)) : 0;
    }
  } catch(e) {}

  // 4. Project Analysis (mock partial scanner run)
  const cwd = process.cwd();
  const depResults = DependencyAnalyzer.analyze(cwd);
  const qualResults = QualityAnalyzer.analyze(cwd);
  
  const detections = [];
  if (depResults.hasPackageJson) detections.push({ name: 'Node.js' });
  try {
    const pkgStr = fs.readFileSync(path.join(cwd, 'package.json'), 'utf8');
    if (pkgStr.includes('"react"')) detections.push({ name: 'React' });
  } catch(e){}

  // Check some secrets quickly in root just to populate data
  const secAnalyzer = new SecurityAnalyzer();
  try {
    const entries = fs.readdirSync(cwd, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isDirectory() && (e.name === '.env' || e.name.endsWith('.pem'))) {
        secAnalyzer.analyzeFile(path.join(cwd, e.name), null);
      }
    }
  } catch(e) {}
  const secResults = secAnalyzer.getResults();

  const data = {
    system: systemInfo,
    disk,
    processes,
    project: {
      detections,
      dependency: depResults,
      quality: qualResults,
      security: secResults
    }
  };

  Logger.stopSpinner(true, 'Telemetry gathered successfully.');

  const advice = KnowledgeEngine.analyze(data);
  
  AiRenderer.printDashboard(advice);
}
