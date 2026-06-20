/**
 * @file knowledgeEngine.js
 * @description The core AI rules engine translating raw metrics into conversational advice.
 */

import path from 'path';

export class KnowledgeEngine {
  static analyze(data) {
    const advice = {
      cpu: [],
      memory: [],
      disk: [],
      environment: [],
      developer: [],
      project: [],
      score: 'Good',
      scoreReason: 'System is running normally.',
      recommendations: []
    };

    let penalty = 0;

    // CPU Heuristics
    const cpuUsage = data.system.cpu.usagePercent || 0;
    if (cpuUsage < 20) {
      advice.cpu.push('Your CPU is mostly idle.');
      advice.cpu.push('There is plenty of processing overhead available for intensive tasks.');
    } else if (cpuUsage < 70) {
      advice.cpu.push('Your CPU usage is at a healthy, moderate level.');
      advice.cpu.push('Standard background operations are running normally.');
    } else if (cpuUsage < 90) {
      advice.cpu.push('Your CPU is quite busy.');
      advice.cpu.push('You might be running background compilation, indexing, or a demanding application.');
      penalty += 1;
    } else {
      advice.cpu.push('Your CPU is critically overloaded.');
      advice.cpu.push('System responsiveness will be degraded. Consider closing heavy applications.');
      advice.recommendations.push({ priority: 'HIGH', text: 'Investigate processes consuming high CPU to restore system performance.' });
      penalty += 3;
    }

    // Memory Heuristics
    const memUsage = data.system.memory.usagePercent || 0;
    if (memUsage < 50) {
      advice.memory.push('Your memory usage is very healthy.');
      advice.memory.push('You have plenty of free RAM available.');
    } else if (memUsage < 80) {
      advice.memory.push('Your memory usage is high, but acceptable.');
      advice.memory.push('Operating systems cache memory dynamically to improve speed.');
    } else {
      advice.memory.push('Your memory usage is critically high.');
      
      const hasBrowser = data.processes.some(p => p.name.toLowerCase().includes('chrome') || p.name.toLowerCase().includes('edge') || p.name.toLowerCase().includes('firefox'));
      if (hasBrowser) {
        advice.memory.push('Several browser tabs or heavy web applications appear to be consuming RAM.');
      } else {
        advice.memory.push('Several large applications are consuming RAM.');
      }
      advice.memory.push('Closing unused tabs or restarting heavy IDEs could improve responsiveness.');
      advice.recommendations.push({ priority: 'HIGH', text: 'Free up system RAM by closing unused browser tabs or background utilities.' });
      penalty += 2;
    }

    // Disk Heuristics
    const diskUsage = data.disk.usagePercent || 0;
    if (diskUsage < 70) {
      advice.disk.push('You have ample free disk space.');
      advice.disk.push('No cleanup is necessary at this time.');
    } else if (diskUsage < 90) {
      advice.disk.push('Your disk space is getting low.');
      advice.disk.push('Consider emptying your trash or clearing application caches.');
      advice.recommendations.push({ priority: 'MEDIUM', text: 'Perform a routine disk cleanup to maintain optimal performance.' });
      penalty += 1;
    } else {
      advice.disk.push('Your disk space is critically low.');
      advice.disk.push('Operating systems require free space for virtual memory (swap) and temp files.');
      advice.disk.push('System stability is at risk until space is freed.');
      advice.recommendations.push({ priority: 'HIGH', text: 'Urgently free up disk space to prevent system instability or crashes.' });
      penalty += 3;
    }

    // Environment Heuristics
    const pathVars = (process.env.PATH || '').split(path.delimiter);
    const uniquePaths = new Set(pathVars);
    if (pathVars.length > uniquePaths.size) {
      advice.environment.push('Duplicate directories were detected in your PATH variable.');
      advice.environment.push('This rarely causes crashes, but can slow down terminal startup times.');
      advice.recommendations.push({ priority: 'LOW', text: 'Clean up your PATH environment variable to remove duplicates.' });
    } else {
      advice.environment.push('Your PATH environment variable is clean with no duplicates.');
    }

    if (!process.env.NODE_ENV) {
      advice.environment.push('The NODE_ENV variable is currently not set.');
    } else {
      advice.environment.push(`Your NODE_ENV is explicitly set to: ${process.env.NODE_ENV}.`);
    }

    // Developer & Project Advice
    const hasNode = data.project.detections.some(d => d.name === 'Node.js');
    if (hasNode) {
      advice.developer.push('You appear to be running Node.js development.');
    }

    const checks = data.project.quality.checks;
    if (!checks.lint) {
      advice.developer.push('Consider enabling ESLint to catch syntax and logic errors early.');
      advice.recommendations.push({ priority: 'MEDIUM', text: 'Install and configure ESLint.' });
      penalty += 1;
    }
    if (!checks.format) {
      advice.developer.push('Install Prettier to enforce consistent code formatting across your team.');
      advice.recommendations.push({ priority: 'LOW', text: 'Add Prettier to your repository.' });
    }
    if (!checks.ci) {
      advice.developer.push('Enable CI (like GitHub Actions) to automate testing before merging code.');
      advice.recommendations.push({ priority: 'MEDIUM', text: 'Setup a Continuous Integration workflow.' });
      penalty += 1;
    }
    if (!checks.tests) {
      advice.developer.push('Your project seems to lack an automated test suite.');
    }
    
    // Project Specifics
    if (data.project.security.length > 0) {
      advice.project.push('Security vulnerabilities were detected in your source code.');
      advice.project.push('Never commit credentials or private keys to version control.');
      advice.recommendations.push({ priority: 'HIGH', text: 'Remediate hardcoded secrets and rotate exposed keys immediately.' });
      penalty += 4;
    } else {
      advice.project.push('Your source code shows no obvious hardcoded secrets or exposed keys.');
    }

    if (data.project.dependency.missingLock) {
      advice.project.push('Your project is missing a lockfile (e.g. package-lock.json).');
      advice.project.push('This can lead to unpredictable builds across different machines.');
      advice.recommendations.push({ priority: 'MEDIUM', text: 'Commit a package lockfile to ensure deterministic dependency resolution.' });
      penalty += 1;
    }

    if (!checks.readme) {
      advice.project.push('Your project is missing a README file, which hurts maintainability.');
      penalty += 1;
    }

    if (advice.project.length === 1 && advice.project[0].includes('no obvious hardcoded secrets')) {
      advice.project.push('Your repository structure appears standard and well-maintained.');
    }

    // Scoring
    if (penalty === 0) {
      advice.score = 'Excellent';
      advice.scoreReason = 'Your system and project are in top condition with no apparent issues.';
    } else if (penalty <= 2) {
      advice.score = 'Good';
      advice.scoreReason = 'Your system is healthy, though minor optimizations are possible.';
    } else if (penalty <= 5) {
      advice.score = 'Fair';
      advice.scoreReason = 'There are multiple areas affecting performance or project quality.';
    } else if (penalty <= 8) {
      advice.score = 'Poor';
      advice.scoreReason = 'Your system or project requires immediate attention in several areas.';
    } else {
      advice.score = 'Critical';
      advice.scoreReason = 'Severe performance, security, or structural issues detected.';
    }

    return advice;
  }
}
