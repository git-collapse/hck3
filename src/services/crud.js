/**
 * @file crud.js
 * @description Interactive CRUD file manager — Create, Read, Update,
 *   Delete, and List with inquirer menu, { success, data, error }
 *   result envelopes, and automatic timestamped .bak backup before
 *   any destructive operation.
 */
import inquirer from 'inquirer';
import { Theme, Logger } from '../utils/logger.js';
import { CrudService } from './crudService.js';
import path from 'path';

export default async function startCrud() {
  console.log('\n' + Theme.secondary.bold('=== INTERACTIVE FILE MANAGER ===') + '\n');
  
  let exit = false;
  while (!exit) {
    const { action } = await inquirer.prompt([
      {
        type: 'select',
        name: 'action',
        message: 'Select an operation:',
        choices: [
          'Create a file',
          'Read a file',
          'Update a file',
          'Delete a file',
          'List directory files',
          new inquirer.Separator(),
          'Exit'
        ]
      }
    ]);

    switch (action) {
      case 'Create a file':
        await handleCreate();
        break;
      case 'Read a file':
        await handleRead();
        break;
      case 'Update a file':
        await handleUpdate();
        break;
      case 'Delete a file':
        await handleDelete();
        break;
      case 'List directory files':
        await handleList();
        break;
      case 'Exit':
        exit = true;
        console.log(Theme.success('Exiting interactive manager. Goodbye!'));
        break;
    }
  }
}

async function handleCreate() {
  const ans = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: 'Enter file path:' },
    { type: 'input', name: 'content', message: 'Enter file content:' },
    { type: 'confirm', name: 'force', message: 'Overwrite if exists?', default: false }
  ]);

  Logger.startSpinner('Creating file...');
  const res = await CrudService.create(path.resolve(ans.filePath), ans.content, ans.force);
  if (res.success) {
    Logger.stopSpinner(true, `File created at ${res.data.path}`);
  } else {
    Logger.stopSpinner(false, `Failed to create file: ${res.error}`);
  }
}

async function handleRead() {
  const { filePath } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: 'Enter file path to read:' }
  ]);

  Logger.startSpinner('Reading file...');
  const res = await CrudService.read(path.resolve(filePath));
  if (res.success) {
    Logger.stopSpinner(true, 'File read successfully.\n');
    console.log(Theme.primary.bold(`>> Metadata:`));
    console.log(`Size: ${res.data.metadata.sizeBytes} bytes`);
    console.log(`Lines: ${res.data.metadata.lines}`);
    console.log(`Extension: ${res.data.metadata.extension || 'None'}`);
    console.log(`Created: ${res.data.metadata.created}`);
    console.log(`Modified: ${res.data.metadata.modified}`);
    console.log(Theme.primary.bold(`\n>> Content:`));
    console.log(Theme.secondary(res.data.content) + '\n');
  } else {
    Logger.stopSpinner(false, `Failed to read file: ${res.error}`);
  }
}

async function handleUpdate() {
  const { filePath, newContent } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: 'Enter file path to update:' },
    { type: 'input', name: 'newContent', message: 'Enter entirely new content:' }
  ]);

  Logger.startSpinner('Updating file...');
  const res = await CrudService.update(path.resolve(filePath), newContent);
  if (res.success) {
    Logger.stopSpinner(true, `File updated. Backup created at ${res.data.backupPath}`);
  } else {
    Logger.stopSpinner(false, `Failed to update file: ${res.error}`);
  }
}

async function handleDelete() {
  const { filePath, skipBackup } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: 'Enter file path to delete:' },
    { type: 'confirm', name: 'skipBackup', message: 'Skip creating a backup before deletion?', default: false }
  ]);

  Logger.startSpinner('Deleting file...');
  const res = await CrudService.delete(path.resolve(filePath), skipBackup);
  if (res.success) {
    if (res.data.backupPath) {
      Logger.stopSpinner(true, `File deleted. Backup saved at ${res.data.backupPath}`);
    } else {
      Logger.stopSpinner(true, `File deleted permanently (No backup).`);
    }
  } else {
    Logger.stopSpinner(false, `Failed to delete file: ${res.error}`);
  }
}

async function handleList() {
  const ans = await inquirer.prompt([
    { type: 'input', name: 'dirPath', message: 'Enter directory path (e.g. ./src):', default: './' },
    { type: 'confirm', name: 'recursive', message: 'Recursive search?', default: false },
    { type: 'input', name: 'extFilter', message: 'Extension filter (e.g. .js) [leave blank for all]:' }
  ]);

  const ext = ans.extFilter.trim() === '' ? null : ans.extFilter.trim();

  Logger.startSpinner('Listing directory...');
  const res = await CrudService.list(path.resolve(ans.dirPath), ans.recursive, ext);
  
  if (res.success) {
    Logger.stopSpinner(true, `Found ${res.data.files.length} matching files.\n`);
    res.data.files.forEach(f => console.log(Theme.secondary(`- ${f}`)));
    console.log();
  } else {
    Logger.stopSpinner(false, `Failed to list directory: ${res.error}`);
  }
}
