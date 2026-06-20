/**
 * @file dependencyAnalyzer.js
 * @description Analyzes package.json and lockfiles for health and heavy dependencies.
 */

import fs from 'fs';
import path from 'path';

export class DependencyAnalyzer {
  static analyze(cwd) {
    const results = {
      hasPackageJson: false,
      dependencies: 0,
      devDependencies: 0,
      missingLock: false,
      heavyPackages: [],
      findings: []
    };

    const pkgPath = path.join(cwd, 'package.json');
    if (!fs.existsSync(pkgPath)) {
      results.findings.push({ severity: 'LOW', message: 'No package.json found. Dependency analysis skipped.' });
      return results;
    }

    results.hasPackageJson = true;
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = pkg.dependencies || {};
      const devDeps = pkg.devDependencies || {};
      
      results.dependencies = Object.keys(deps).length;
      results.devDependencies = Object.keys(devDeps).length;

      const heavyList = ['lodash', 'moment', 'rxjs', 'three', 'd3'];
      for (const d of Object.keys(deps)) {
        if (heavyList.includes(d)) {
          results.heavyPackages.push(d);
          results.findings.push({ severity: 'MEDIUM', message: `Heavy package "${d}" detected. Consider modular imports or lighter alternatives.` });
        }
      }

      const hasNpmLock = fs.existsSync(path.join(cwd, 'package-lock.json'));
      const hasYarnLock = fs.existsSync(path.join(cwd, 'yarn.lock'));
      const hasPnpmLock = fs.existsSync(path.join(cwd, 'pnpm-lock.yaml'));

      if (!hasNpmLock && !hasYarnLock && !hasPnpmLock) {
        results.missingLock = true;
        results.findings.push({ severity: 'HIGH', message: 'Missing lockfile (package-lock.json, yarn.lock, etc). Builds may be non-deterministic.' });
      }

    } catch (e) {
      results.findings.push({ severity: 'HIGH', message: 'Failed to parse package.json' });
    }

    return results;
  }
}
