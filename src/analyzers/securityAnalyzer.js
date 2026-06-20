/**
 * @file securityAnalyzer.js
 * @description Analyzes code and filenames for security vulnerabilities like secrets and tokens.
 */

export class SecurityAnalyzer {
  constructor() {
    this.findings = [];
    this.secretsRegex = /(api_key|apikey|secret|password|passwd|pwd|token|auth|access_key)[a-z0-9_]*\s*[:=]\s*["']([a-zA-Z0-9\-_]{8,})["']/i;
    this.awsRegex = /(A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/;
    this.privateKeyRegex = /-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----/;
  }

  analyzeFile(filePath, content) {
    const filename = filePath.split(/[/\\]/).pop().toLowerCase();
    
    // Check filenames
    if (filename === '.env' || filename === '.env.local') {
      this.findings.push({ severity: 'CRITICAL', file: filePath, message: '.env file detected in codebase. Ensure it is excluded via .gitignore.' });
    } else if (filename.endsWith('.pem') || filename.endsWith('.key')) {
      this.findings.push({ severity: 'HIGH', file: filePath, message: 'Key file detected in codebase.' });
    }

    if (!content) return;

    // Check contents
    if (this.privateKeyRegex.test(content)) {
      this.findings.push({ severity: 'CRITICAL', file: filePath, message: 'Private Key detected in source code.' });
    }

    if (this.awsRegex.test(content)) {
      this.findings.push({ severity: 'CRITICAL', file: filePath, message: 'AWS Access Key detected in source code.' });
    }

    const match = this.secretsRegex.exec(content);
    if (match) {
      this.findings.push({ severity: 'HIGH', file: filePath, message: `Hardcoded secret/token detected (${match[1]}). Use environment variables instead.` });
    }
  }

  getResults() {
    return this.findings;
  }
}
