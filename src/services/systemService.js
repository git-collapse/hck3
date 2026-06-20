/**
 * @file systemService.js
 * @description System Information Engine
 * @responsibilities Collects core system, OS, CPU, memory, network, and Node.js details securely.
 */

import os from 'os';
import process from 'process';

export class SystemService {
  static getSystemInfo() {
    return {
      general: this.getGeneralInfo(),
      cpu: this.getCpuInfo(),
      memory: this.getMemoryInfo(),
      network: this.getNetworkInfo(),
      system: this.getSysTimeInfo(),
      node: this.getNodeInfo(),
      health: null // Computed after
    };
  }

  static getGeneralInfo() {
    let username = 'Not Available';
    try {
      username = os.userInfo().username;
    } catch (e) {}

    return {
      osName: os.type(),
      osRelease: os.release(),
      osVersion: os.version ? os.version() : 'Not Available',
      platform: os.platform(),
      architecture: os.arch(),
      hostname: os.hostname(),
      currentUser: username,
      homeDirectory: os.homedir(),
      cwd: process.cwd(),
      tempDirectory: os.tmpdir(),
      nodeVersion: process.version,
      pid: process.pid,
      ppid: process.ppid
    };
  }

  static getCpuInfo() {
    const cpus = os.cpus() || [];
    let loadAvg = 'Not Available';
    try {
      const avg = os.loadavg();
      if (avg && avg.length > 0 && avg[0] > 0) {
        loadAvg = avg.map(x => x.toFixed(2)).join(', ');
      }
    } catch (e) {}

    return {
      model: cpus.length > 0 ? cpus[0].model : 'Not Available',
      count: cpus.length, // Logical threads
      speed: cpus.length > 0 ? cpus[0].speed : 'Not Available',
      endianness: os.endianness(),
      loadAverage: loadAvg,
      architecture: os.arch()
    };
  }

  static getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    const usagePercent = total > 0 ? parseFloat(((used / total) * 100).toFixed(2)) : 0;
    const freePercent = total > 0 ? parseFloat(((free / total) * 100).toFixed(2)) : 0;

    return {
      total,
      free,
      used,
      usagePercent,
      freePercent
    };
  }

  static getNetworkInfo() {
    const interfaces = os.networkInterfaces();
    const networkDetails = [];

    for (const [name, ifaces] of Object.entries(interfaces)) {
      ifaces.forEach(iface => {
        networkDetails.push({
          interface: name,
          family: iface.family,
          address: iface.address,
          internal: iface.internal,
          mac: iface.mac
        });
      });
    }

    return networkDetails;
  }

  static getSysTimeInfo() {
    const uptime = os.uptime();
    const now = new Date();
    const bootTime = new Date(now.getTime() - uptime * 1000);
    
    return {
      uptimeSeconds: uptime,
      currentTime: now,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Not Available',
      locale: Intl.DateTimeFormat().resolvedOptions().locale || 'Not Available',
      bootTime: bootTime
    };
  }

  static getNodeInfo() {
    return {
      nodeVersion: process.version,
      v8Version: process.versions.v8 || 'Not Available',
      processArch: process.arch,
      platform: process.platform,
      execPath: process.execPath
    };
  }

  static getHealthSummary(mem, cpu, sys, node) {
    let score = 100;
    const reasons = [];

    if (mem.usagePercent > 90) { 
      score -= 30; 
      reasons.push('Critically high memory usage.'); 
    } else if (mem.usagePercent > 75) { 
      score -= 15; 
      reasons.push('High memory usage.'); 
    } else { 
      reasons.push('High available memory'); 
    }

    if (cpu.count < 2) { 
      score -= 20; 
      reasons.push('and single-core processor.'); 
    } else { 
      reasons.push('and multi-core processor.'); 
    }

    if (sys.uptimeSeconds < 300) {
      score -= 5;
      reasons.push('(System recently restarted).');
    }

    score = Math.max(0, Math.min(100, score));
    
    let rating = 'Excellent';
    if (score < 50) rating = 'Needs Attention';
    else if (score < 80) rating = 'Average';
    else if (score < 90) rating = 'Good';

    return {
      score: `${score} / 100`,
      rating,
      explanation: reasons.join(' ')
    };
  }
}
