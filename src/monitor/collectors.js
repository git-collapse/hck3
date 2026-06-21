/**
 * @file collectors.js
 * @description Asynchronous metric collectors for live monitoring (Disk, Network, Battery, Processes).
 */

import { exec } from 'child_process';
import fs from 'fs';
import dns from 'dns';
import os from 'os';

export class AsyncCollectors {
  constructor() {
    this.networkSpeeds = { rx: 0, tx: 0, rxSpeed: 0, txSpeed: 0 };
    this.processes = [];
    this.battery = { available: false, percent: 0, status: 'N/A' };
    this.internet = 'Checking...';
    
    this.startPolling();
  }

  startPolling() {
    this.pollNetwork();
    this.pollProcesses();
    this.pollBattery();
    this.pollInternet();

    setInterval(() => this.pollNetwork(), 1000);
    setInterval(() => this.pollProcesses(), 2000);
    setInterval(() => this.pollBattery(), 10000);
    setInterval(() => this.pollInternet(), 3000);
  }

  pollNetwork() {
    const handleStats = (rx, tx) => {
      if (this.networkSpeeds.rx > 0) {
        this.networkSpeeds.rxSpeed = rx - this.networkSpeeds.rx;
        this.networkSpeeds.txSpeed = tx - this.networkSpeeds.tx;
      }
      this.networkSpeeds.rx = rx;
      this.networkSpeeds.tx = tx;
    };

    const fallback = () => {
      this.networkSpeeds.rxSpeed = 0;
      this.networkSpeeds.txSpeed = 0;
    };

    if (process.platform === 'win32') {
      exec('netstat -e', (err, stdout) => {
        if (!err) {
          const lines = stdout.split('\\n');
          for (const line of lines) {
            if (line.trim().startsWith('Bytes')) {
              const parts = line.trim().split(/\\s+/);
              if (parts.length >= 3) {
                handleStats(parseInt(parts[1], 10) || 0, parseInt(parts[2], 10) || 0);
              }
            }
          }
        } else fallback();
      });
    } else if (process.platform === 'linux') {
      try {
        const raw = fs.readFileSync('/proc/net/dev', 'utf8');
        const lines = raw.split('\n').slice(2).filter(l => l.trim());
        let rx = 0, tx = 0;
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts[0] && parts[0].startsWith('lo:')) continue;
          rx += parseInt(parts[1], 10) || 0;
          tx += parseInt(parts[9], 10) || 0;
        }
        if (this.networkSpeeds.rx > 0) {
          this.networkSpeeds.rxSpeed = Math.max(0, rx - this.networkSpeeds.rx);
          this.networkSpeeds.txSpeed = Math.max(0, tx - this.networkSpeeds.tx);
        }
        this.networkSpeeds.rx = rx;
        this.networkSpeeds.tx = tx;
      } catch(e) {
        this.networkSpeeds.rxSpeed = 0;
        this.networkSpeeds.txSpeed = 0;
      }
    } else if (process.platform === 'darwin') {
      exec('netstat -ibn', (err, stdout) => {
        if (err) return;
        let rx = 0, tx = 0;
        stdout.split('\n').slice(1).filter(l => l.trim()).forEach(line => {
          const p = line.trim().split(/\s+/);
          if (!p[0] || p[0] === 'Name') return;
          rx += parseInt(p[6], 10) || 0;
          tx += parseInt(p[9], 10) || 0;
        });
        if (this.networkSpeeds.rx > 0) {
          this.networkSpeeds.rxSpeed = Math.max(0, rx - this.networkSpeeds.rx);
          this.networkSpeeds.txSpeed = Math.max(0, tx - this.networkSpeeds.tx);
        }
        this.networkSpeeds.rx = rx;
        this.networkSpeeds.tx = tx;
      });
    } else {
      fallback();
    }
  }

  pollProcesses() {
    if (process.platform === 'win32') {
      exec('tasklist /FO CSV /NH', (err, stdout) => {
        if (!err) {
          const lines = stdout.split('\n').filter(l => l.trim().length > 0);
          const procs = lines.map(l => {
            const parts = l.split('","').map(p => p.replace(/"/g, ''));
            if (parts.length >= 5) {
              const memStr = parts[4].replace(/[^0-9]/g, '');
              return { name: parts[0], pid: parts[1], memKB: parseInt(memStr, 10) || 0 };
            }
            return null;
          }).filter(Boolean);
          
          procs.sort((a, b) => b.memKB - a.memKB); // Fallback: Sort by Memory on Windows natively
          this.processes = procs.slice(0, 5).map(p => ({
            pid: p.pid,
            name: p.name.substring(0, 20),
            cpu: 'N/A', // Win32 native lacks CPU% efficiently
            mem: `${(p.memKB / 1024).toFixed(1)} MB`
          }));
        }
      });
    } else {
      exec('ps -eo pid,comm,%cpu,%mem --sort=-%cpu | head -n 6', (err, stdout) => {
        if (!err) {
          const lines = stdout.split('\n').slice(1).filter(l => l.trim().length > 0);
          this.processes = lines.map(l => {
            const parts = l.trim().split(/\s+/);
            return { pid: parts[0], name: parts[1].substring(0, 20), cpu: parts[2] + '%', mem: parts[3] + '%' };
          });
        }
      });
    }
  }

  pollBattery() {
    if (process.platform === 'win32') {
      exec('wmic path Win32_Battery get EstimatedChargeRemaining,BatteryStatus /format:csv', (err, stdout) => {
        if (!err && stdout.includes(',')) {
          const lines = stdout.split('\n').filter(l => l.trim().length > 0);
          if (lines.length > 1) {
            const parts = lines[1].split(',');
            if (parts.length >= 3) {
              const statusMap = { 1: 'Discharging', 2: 'AC Power (Charging)', 3: 'Fully Charged' };
              const statCode = parseInt(parts[1], 10);
              const status = statusMap[statCode] || 'Unknown';
              const charge = parts[2].trim();
              this.battery = { available: true, percent: charge, status, source: statCode === 2 ? 'AC' : 'Battery' };
              return;
            }
          }
        }
        this.battery = { available: false };
      });
    } else {
      this.battery = { available: false };
    }
  }

  pollInternet() {
    dns.lookup('google.com', (err) => {
      this.internet = err ? 'No' : 'Yes';
    });
  }

  getDiskInfo() {
    try {
      if (fs.statfsSync) {
        const cwd = process.cwd();
        const stat = fs.statfsSync(cwd);
        const total = stat.blocks * stat.bsize;
        const free = stat.bavail * stat.bsize;
        const used = total - free;
        const usage = total > 0 ? parseFloat(((used / total) * 100).toFixed(2)) : 0;
        return { 
          total, free, used, usagePercent: usage, 
          fsType: 'Native/OS Default', 
          drive: cwd.substring(0, 3) 
        };
      }
    } catch(e) {}
    return {
      total: 0, free: 0, used: 0, usagePercent: 0, fsType: 'N/A', drive: 'N/A'
    };
  }

  getData() {
    return {
      network: this.networkSpeeds,
      processes: this.processes,
      battery: this.battery,
      internet: this.internet,
      disk: this.getDiskInfo()
    };
  }
}
