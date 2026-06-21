/**
 * @file cli.js
 * @description Command Line Interface definition
 * @responsibilities Parses command line arguments, sets up commands, and delegates to services.
 * @future Add interactive wizard mode.
 */

import { Command } from 'commander';
import { Theme } from './utils/logger.js';

export function setupCLI(pkg) {
  const program = new Command();

  program
    .name(pkg.name)
    .description(Theme.secondary(pkg.description))
    .version(pkg.version, '-v, --version', 'Output the current version')
    .usage('<command> [options]')
    .configureHelp({
      sortSubcommands: true,
      subcommandTerm: (cmd) => Theme.primary(cmd.name()) + ' ' + Theme.dim(cmd.alias() || ''),
    });

  program
    .command('system')
    .alias('sys')
    .description('Collect comprehensive system information')
    .option('--json', 'Export report as JSON')
    .action(async (options) => {
      const module = await import('./core/system.js');
      await module.default(options);
    });

  program
    .command('env')
    .alias('e')
    .description('Display selected environment variables safely')
    .action(async () => {
      const module = await import('./core/environment.js');
      await module.default();
    });

  program
    .command('scan')
    .alias('s')
    .description('Scan project directory for structure and metadata')
    .option('--html', 'Generate HTML report')
    .option('--md', 'Generate Markdown report')
    .option('--json', 'Generate JSON report')
    .action(async (options) => {
      const module = await import('./analyzers/scanner.js');
      await module.default(options);
    });

  program
    .command('crud')
    .alias('c')
    .description('Perform file system operations safely')
    .action(async () => {
      const module = await import('./services/crud.js');
      await module.default();
    });

  program
    .command('report')
    .alias('r')
    .description('Generate beautiful reports of the collected data')
    .option('--html', 'Generate HTML report')
    .option('--md', 'Generate Markdown report')
    .option('--json', 'Generate JSON report')
    .action(async (options) => {
      const module = await import('./reports/reportBuilder.js');
      await module.default(options);
    });

  program
    .command('doctor')
    .alias('d')
    .description('Intelligently analyze system information and generate meaningful diagnostics')
    .action(async (options) => {
      const module = await import('./core/doctor.js');
      await module.default(options);
    });

  program
    .command('monitor')
    .alias('m')
    .description('Live real-time system monitoring dashboard.')
    .action(async (options) => {
      const module = await import('./monitor/monitor.js');
      await module.default(options);
    });

  program
    .command('health')
    .alias('h')
    .description('Check application health and dependencies')
    .action(async () => {
      const { Logger, Theme } = await import('./utils/logger.js');
      const fs = (await import('fs')).default;
      const path = (await import('path')).default;
      const cwd = process.cwd();

      const checks = [
        { name: 'package.json exists',
          pass: fs.existsSync(path.join(cwd, 'package.json')) },
        { name: 'node_modules installed',
          pass: fs.existsSync(path.join(cwd, 'node_modules')) },
        { name: `Node.js >= 18 (current: ${process.version})`,
          pass: parseInt(process.version.replace('v','').split('.')[0], 10) >= 18 },
        { name: 'logs/ directory writable', pass: (() => {
            try { fs.mkdirSync(path.join(cwd,'logs'),{recursive:true}); return true; }
            catch(e) { return false; }
          })() },
        { name: 'reports/ directory writable', pass: (() => {
            try { fs.mkdirSync(path.join(cwd,'reports'),{recursive:true}); return true; }
            catch(e) { return false; }
          })() },
        { name: '.gitignore present',
          pass: fs.existsSync(path.join(cwd, '.gitignore')) },
        { name: 'No .env file exposed in project root',
          pass: !fs.existsSync(path.join(cwd, '.env')) },
      ];

      const allPass = checks.every(c => c.pass);
      console.log('\n' + Theme.secondary.bold('=== APPLICATION HEALTH CHECK ===') + '\n');
      checks.forEach(c => {
        const icon = c.pass ? Theme.success('✔') : Theme.error('✖');
        console.log(`  ${icon}  ${c.pass ? c.name : Theme.warning(c.name)}`);
      });
      const score = checks.filter(c => c.pass).length;
      const scoreStr = `${score}/7 checks passed`;
      console.log(`\n  Score: ${allPass ? Theme.success(scoreStr) : Theme.warning(scoreStr)}\n`);
    });

  program
    .command('ai')
    .description('Intelligent rule-based local system advisor')
    .action(async (options) => {
      const module = await import('./advisor/aiCommand.js');
      await module.default(options);
    });

  program
    .command('dashboard')
    .alias('db')
    .description('Premium full-screen terminal dashboard')
    .action(async () => {
      const module = await import('./dashboard/dashboardCommand.js');
      await module.default();
    });

  program.on('command:*', function (operands) {
    console.error(Theme.error(`\n✖ Error: Unknown command '${operands[0]}'\n`));
    program.outputHelp();
    process.exitCode = 1;
  });

  program.on('--help', () => {
    console.log('');
    console.log(Theme.primary('Examples:'));
    console.log(`  $ npm start -- dashboard`);
    console.log(`  $ npm start -- scan --html`);
    console.log(`  $ npm start -- report --md`);
    console.log(`  $ npm start -- ai`);
    console.log('');
    console.log(Theme.primary('Quick Start:'));
    console.log(Theme.dim(`  Run "npm start -- help <command>" for detailed usage.`));
    console.log('');
  });

  return program;
}
