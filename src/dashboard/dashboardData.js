/**
 * @file dashboardData.js
 * @description Background data aggregator for the dashboard.
 */

import { MonitorService } from '../monitor/monitorService.js';
import { DoctorService } from '../services/doctorService.js';
import { KnowledgeEngine } from '../advisor/knowledgeEngine.js';
import { DependencyAnalyzer } from '../analyzers/dependencyAnalyzer.js';
import { QualityAnalyzer } from '../analyzers/qualityAnalyzer.js';
import { SecurityAnalyzer } from '../analyzers/securityAnalyzer.js';

export class DashboardData {
  constructor() {
    this.monitorService = new MonitorService();
    this.sysInfo = { cpu: {}, memory: {}, network: {}, os: '', disk: {} };
    this.doctorData = { grade: 'N/A', score: 0, warnings: [] };
    this.aiAdvice = { score: 'N/A', scoreReason: 'N/A' };
    this.alerts = [];
    this.theme = 'dark';
    this.activeOverlay = null;
    this.init();
  }

  init() {
    const cwd = process.cwd();
    this.doctorData = DoctorService.runDiagnostics();
    const dep = DependencyAnalyzer.analyze(cwd);
    const qual = QualityAnalyzer.analyze(cwd);
    const sec = new SecurityAnalyzer().getResults();
    
    const detections = [];
    if (dep.hasPackageJson) detections.push({ name: 'Node.js' });
    
    const rtm = this.monitorService.getRealTimeMetrics();
    this.aiAdvice = KnowledgeEngine.analyze({
      system: { cpu: rtm.cpu, memory: rtm.memory },
      disk: rtm.disk,
      processes: [],
      project: { detections, dependency: dep, quality: qual, security: sec }
    });
  }

  refresh() {
    this.sysInfo = this.monitorService.getRealTimeMetrics();
    
    const cpuVal = this.sysInfo.cpu.usagePercent || 0;
    const memVal = this.sysInfo.memory.usagePercent || 0;
    const diskVal = this.sysInfo.disk.usagePercent || 0;

    this.alerts = [];
    if (cpuVal > 90) this.alerts.push('[CRITICAL] CPU load exceeds 90%');
    else if (cpuVal > 75) this.alerts.push('[WARN] High CPU load detected');

    if (memVal > 90) this.alerts.push('[CRITICAL] Memory usage exceeds 90%');
    else if (memVal > 80) this.alerts.push('[WARN] Memory usage is running high');

    if (diskVal > 90) this.alerts.push('[WARN] Disk space is low');
  }
}
