/**
 * @file monitorService.js
 * @description Provides real-time metrics for the live dashboard.
 */

import os from 'os';
import { SystemService } from '../services/systemService.js';
import { AsyncCollectors } from './collectors.js';

export class MonitorService {
  constructor() {
    this.previousCpu = this.getCpuTimes();
    this.collectors = new AsyncCollectors();
  }

  getCpuTimes() {
    const cpus = os.cpus() || [];
    let idle = 0;
    let total = 0;
    
    for (const cpu of cpus) {
      if (cpu.times) {
        for (const type in cpu.times) {
          total += cpu.times[type];
        }
        idle += cpu.times.idle;
      }
    }
    
    return { idle, total };
  }

  getRealTimeMetrics() {
    const info = SystemService.getSystemInfo();
    const currentCpu = this.getCpuTimes();
    
    const idleDifference = currentCpu.idle - this.previousCpu.idle;
    const totalDifference = currentCpu.total - this.previousCpu.total;
    
    let cpuUsagePercent = 0;
    if (totalDifference > 0) {
      cpuUsagePercent = Math.round(100 - (100 * idleDifference / totalDifference));
    }
    this.previousCpu = currentCpu;

    const asyncData = this.collectors.getData();

    // Calculate overall grade
    const grade = this.calculateHealthGrade(cpuUsagePercent, info.memory.usagePercent, asyncData.disk.usagePercent, asyncData.internet);

    return {
      time: info.system.currentTime.toLocaleString(),
      uptime: info.system.uptimeSeconds,
      hostname: info.general.hostname,
      os: `${info.general.osName} ${info.general.osRelease}`,
      cpu: {
        usagePercent: cpuUsagePercent,
        count: info.cpu.count,
        model: info.cpu.model,
        health: cpuUsagePercent > 80 ? 'High Usage' : 'Healthy'
      },
      memory: {
        used: info.memory.used,
        free: info.memory.free,
        total: info.memory.total,
        usagePercent: info.memory.usagePercent,
        health: info.memory.usagePercent > 85 ? 'Warning' : 'Healthy'
      },
      disk: {
        ...asyncData.disk,
        health: asyncData.disk.usagePercent > 90 ? 'Warning' : 'Healthy'
      },
      battery: asyncData.battery,
      network: {
        ip: info.network.length > 0 ? info.network[0].address : 'N/A',
        mac: info.network.length > 0 ? info.network[0].mac : 'N/A',
        rxSpeed: asyncData.network.rxSpeed,
        txSpeed: asyncData.network.txSpeed,
        internet: asyncData.internet,
        health: asyncData.internet === 'Yes' ? 'Connected' : 'Disconnected'
      },
      processes: asyncData.processes,
      grade
    };
  }

  calculateHealthGrade(cpu, mem, disk, internet) {
    let score = 100;
    if (cpu > 80) score -= 20;
    if (mem > 85) score -= 20;
    if (disk > 90) score -= 15;
    if (internet === 'No') score -= 10;

    if (score >= 95) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 70) return 'B';
    if (score >= 50) return 'C';
    return 'D';
  }
}
