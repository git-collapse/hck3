/**
 * @file qualityAnalyzer.js
 * @description Analyzes project configuration and best practices.
 */

import fs from 'fs';
import path from 'path';

export class QualityAnalyzer {
  static analyze(cwd) {
    const checks = {
      readme: fs.existsSync(path.join(cwd, 'README.md')) || fs.existsSync(path.join(cwd, 'readme.md')),
      license: fs.existsSync(path.join(cwd, 'LICENSE')) || fs.existsSync(path.join(cwd, 'LICENSE.md')),
      gitignore: fs.existsSync(path.join(cwd, '.gitignore')),
      editorconfig: fs.existsSync(path.join(cwd, '.editorconfig')),
      ci: fs.existsSync(path.join(cwd, '.github', 'workflows')) || fs.existsSync(path.join(cwd, '.gitlab-ci.yml')),
      tests: fs.existsSync(path.join(cwd, '__tests__')) || fs.existsSync(path.join(cwd, 'test')) || fs.existsSync(path.join(cwd, 'tests')),
      lint: fs.existsSync(path.join(cwd, '.eslintrc.json')) || fs.existsSync(path.join(cwd, '.eslintrc.js')) || fs.existsSync(path.join(cwd, 'eslint.config.js')),
      format: fs.existsSync(path.join(cwd, '.prettierrc')) || fs.existsSync(path.join(cwd, '.prettierrc.json'))
    };

    let score = 100;
    const missing = [];

    if (!checks.readme) { score -= 15; missing.push('Create a README.md to document your project.'); }
    if (!checks.license) { score -= 5; missing.push('Add a LICENSE file to clarify usage rights.'); }
    if (!checks.gitignore) { score -= 20; missing.push('Add a .gitignore file to prevent committing temp files.'); }
    if (!checks.editorconfig) { score -= 5; missing.push('Add .editorconfig for consistent developer formatting.'); }
    if (!checks.ci) { score -= 10; missing.push('Setup a CI workflow to automate tests and builds.'); }
    if (!checks.tests) { score -= 15; missing.push('Add tests to ensure code reliability.'); }
    if (!checks.lint) { score -= 5; missing.push('Add a linter (e.g. ESLint) to catch errors early.'); }
    if (!checks.format) { score -= 5; missing.push('Add a formatter (e.g. Prettier) to standardize code style.'); }

    const grade = score >= 95 ? 'A+' : score >= 85 ? 'A' : score >= 75 ? 'B' : score >= 65 ? 'C' : score >= 50 ? 'D' : 'F';

    return {
      checks,
      score,
      grade,
      recommendations: missing
    };
  }
}
