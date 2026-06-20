/**
 * @file index.js
 * @description Application entry point
 * @responsibilities Bootstraps the application, initializes core components, and starts CLI router.
 * @future Add clustering support.
 */

import fs from 'fs';
import path from 'path';
import { displayBanner } from './utils/helper.js';
import { ConfigManager } from './config/config.js';
import { handleGlobalError } from './errors/errors.js';
import { setupCLI } from './cli.js';

// Handle uncaught errors gracefully
process.on('uncaughtException', handleGlobalError);
process.on('unhandledRejection', handleGlobalError);

async function bootstrap() {
  try {
    const packagePath = path.resolve(process.cwd(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
    
    const args = process.argv;
    // Only show banner if we are executing a real command or default help,
    // to keep output clean on just -h or -v flags.
    const isHelpOrVersion = args.includes('--help') || args.includes('-h') || args.includes('--version') || args.includes('-v');
    
    if (!isHelpOrVersion) {
      displayBanner();
    }
    
    // Initialize config
    const config = ConfigManager.loadConfig();
    global.config = config;

    const program = setupCLI(pkg);
    await program.parseAsync(process.argv);
    
    if (!process.argv.slice(2).length && !isHelpOrVersion) {
      program.outputHelp();
    }
  } catch (error) {
    handleGlobalError(error);
  }
}

bootstrap();
