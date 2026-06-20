/**
 * @file doctorService.js
 * @description System Intelligence Engine
 * @responsibilities Analyzes system data to generate meaningful diagnostics and recommendations.
 */

import fs from 'fs';
import { SystemService } from './systemService.js';

export class DoctorService {
  static runDiagnostics() {
    const info = SystemService.getSystemInfo();
    const recommendations = [];
    let score = 100;
    
    // Analyses
    const cpu = this.analyzeCpu(info.cpu);
    if (cpu.scorePenalty) score -= cpu.scorePenalty;
    if (cpu.recommendation) recommendations.push(cpu.recommendation);

    const mem = this.analyzeMemory(info.memory);
    if (mem.scorePenalty) score -= mem.scorePenalty;
    if (mem.recommendation) recommendations.push(mem.recommendation);

    const node = this.analyzeNode(info.node);
    if (node.scorePenalty) score -= node.scorePenalty;
    if (node.recommendation) recommendations.push(node.recommendation);

    const env = this.analyzeEnvironment();
    if (env.scorePenalty) score -= env.scorePenalty;
    if (env.recommendation) recommendations.push(env.recommendation);

    const disk = this.analyzeDisk(info.general.cwd);
    if (disk.recommendation) recommendations.push(disk.recommendation);
    
    const uptime = this.analyzeUptime(info.system);
    if (uptime.recommendation) recommendations.push(uptime.recommendation);
    
    score = Math.max(0, Math.min(100, score));
    const grade = this.calculateGrade(score);

    return {
      score,
      grade,
      cpu,
      memory: mem,
      node,
      environment: env,
      disk,
      uptime,
      recommendations
    };
  }

  static analyzeCpu(cpuInfo) {
    const count = cpuInfo.count;
    let status = 'Excellent';
    let reason = `${count} logical cores detected.`;
    let recommendation = 'Suitable for heavy development.';
    let scorePenalty = 0;

    if (count < 2) {
      status = 'Critical';
      recommendation = 'Close unnecessary background applications to reduce CPU load.';
      scorePenalty = 20;
    } else if (count < 4) {
      status = 'Average';
      recommendation = 'Suitable for general tasks, may struggle with heavy builds.';
      scorePenalty = 10;
    } else if (count < 8) {
      status = 'Good';
    }

    return { status, reason, recommendation, scorePenalty, detected: `${count} Cores @ ${cpuInfo.speed}MHz` };
  }

  static analyzeMemory(memInfo) {
    const usage = memInfo.usagePercent;
    let status = 'Excellent';
    let recommendation = null;
    let scorePenalty = 0;

    if (usage > 90) {
      status = 'Critical';
      recommendation = 'Reduce RAM usage by closing heavy applications.';
      scorePenalty = 25;
    } else if (usage > 80) {
      status = 'Warning';
      recommendation = 'Monitor RAM usage closely.';
      scorePenalty = 15;
    } else if (usage > 60) {
      status = 'Good';
    }

    return { 
      status, 
      reason: `RAM usage is at ${usage}%.`, 
      recommendation, 
      scorePenalty, 
      detected: `${usage}% Used` 
    };
  }

  static analyzeNode(nodeInfo) {
    const v = nodeInfo.nodeVersion;
    const majorStr = v.replace('v', '').split('.')[0];
    const major = parseInt(majorStr, 10);
    
    let status = 'Excellent';
    let reason = 'Modern Node.js version detected.';
    let recommendation = null;
    let scorePenalty = 0;

    if (major < 18) {
      status = 'Critical';
      reason = 'Unsupported Node.js version.';
      recommendation = 'Update Node.js to an active LTS version (v20 or v22).';
      scorePenalty = 15;
    } else if (major === 18) {
      status = 'Warning';
      reason = 'Old Node.js version in maintenance mode.';
      recommendation = 'Consider updating Node.js to v20 or v22 soon.';
      scorePenalty = 5;
    }

    return { status, reason, recommendation, scorePenalty, detected: v };
  }

  static analyzeEnvironment() {
    let scorePenalty = 0;
    const issues = [];
    const masks = [];
    
    const requiredVars = ['PATH', 'HOME', 'TEMP', 'USERPROFILE'];
    let foundCount = 0;
    
    for (const v of requiredVars) {
      if (process.env[v]) {
        foundCount++;
        const val = process.env[v];
        masks.push(`${v}: ${val.substring(0, 3)}***`);
      }
    }

    if (!process.env.NODE_ENV) {
      issues.push('NODE_ENV is not set.');
      scorePenalty += 5;
    }

    let status = 'Excellent';
    let recommendation = null;
    
    if (issues.length > 0) {
      status = 'Warning';
      recommendation = 'Configure missing environment variables (e.g., NODE_ENV).';
    }

    return { 
      status, 
      reason: `${foundCount} standard env vars detected. ${issues.join(' ')}`, 
      recommendation, 
      scorePenalty, 
      detected: 'Environment inspected safely.' 
    };
  }

  static analyzeDisk(cwd) {
    let status = 'Info';
    let reason = 'Information unavailable on this platform.';
    let recommendation = null;
    let detected = 'N/A';

    try {
      if (fs.statfsSync) {
        const stat = fs.statfsSync(cwd);
        const freeGB = (stat.bfree * stat.bsize) / (1024 ** 3);
        detected = `${freeGB.toFixed(2)} GB Free on mount`;
        
        if (freeGB < 5) {
          status = 'Warning';
          reason = 'Low disk space detected.';
          recommendation = 'Clean temporary files to free up disk space.';
        } else {
          status = 'Excellent';
          reason = 'Plenty of disk space available.';
        }
      }
    } catch (e) {
      // Gracefully handle unsupported API
    }

    return { status, reason, recommendation, scorePenalty: 0, detected };
  }

  static analyzeUptime(sysInfo) {
    const days = sysInfo.uptimeSeconds / 86400;
    let recommendation = null;
    
    if (days > 14) {
      recommendation = 'Restart after long uptime to clear system cache.';
    }

    return { 
      status: 'Info', 
      reason: `System running for ${days.toFixed(1)} days.`, 
      recommendation, 
      scorePenalty: 0, 
      detected: `${days.toFixed(1)} Days` 
    };
  }

  static calculateGrade(score) {
    if (score >= 95) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 60) return 'Average';
    if (score >= 40) return 'Poor';
    return 'Critical';
  }
}
