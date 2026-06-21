/**
 * @file crud.js
 * @description Interactive CRUD file manager.
 *   Provides Create, Read, Update, Delete, and List operations on
 *   code files via an inquirer-powered interactive menu.
 *   All destructive operations write a timestamped .bak backup first.
 *   Every operation returns { success, data, error } — never throws.
 */
import fs from 'fs';
import path from 'path';
import inquirer from 'inquirer';
import { Logger, Theme } from '../utils/logger.js';
import { formatBytes } from '../utils/formatter.js';

function ok(data) { return { success: true, data, error: null }; }
function fail(err) { return { success: false, data: null, error: err instanceof Error ? err.message : String(err) }; }

function makeBackup(absPath) {
  if (!fs.existsSync(absPath)) return null;
  const ext = path.extname(absPath);
  const base = path.basename(absPath, ext);
  const dir = path.dirname(absPath);
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const dest = path.join(dir, `${base}.${ts}${ext}.bak`);
  fs.copyFileSync(absPath, dest);
  return dest;
}

export function createFile(filePath, content = '', options = {}) {
  try {
    const abs = path.resolve(filePath);
    if (fs.existsSync(abs) && !options.force)
      return fail(`File already exists: ${abs}. Use { force: true } to overwrite.`);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, content, 'utf8');
    const stat = fs.statSync(abs);
    return ok({ operation: 'CREATE', path: abs, sizeBytes: stat.size,
      lines: content.split('\n').length, createdAt: stat.birthtime.toISOString() });
  } catch (err) { return fail(err); }
}

export function readFile(filePath) {
  try {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) return fail(`File not found: ${abs}`);
    if (!fs.statSync(abs).isFile()) return fail(`Not a file: ${abs}`);
    const content = fs.readFileSync(abs, 'utf8');
    const stat = fs.statSync(abs);
    return ok({ operation: 'READ', path: abs, content, sizeBytes: stat.size,
      lines: content.split('\n').length, extension: path.extname(abs) || '(none)',
      lastModified: stat.mtime.toISOString(), createdAt: stat.birthtime.toISOString() });
  } catch (err) { return fail(err); }
}

export function updateFile(filePath, contentOrFn) {
  try {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) return fail(`File not found: ${abs}`);
    const oldContent = fs.readFileSync(abs, 'utf8');
    const newContent = typeof contentOrFn === 'function'
      ? contentOrFn(oldContent) : contentOrFn;
    if (typeof newContent !== 'string')
      return fail('Content must be a string or transform must return a string.');
    const backedUpTo = makeBackup(abs);
    fs.writeFileSync(abs, newContent, 'utf8');
    const stat = fs.statSync(abs);
    return ok({ operation: 'UPDATE', path: abs, backedUpTo,
      previousLines: oldContent.split('\n').length,
      newLines: newContent.split('\n').length,
      sizeBytes: stat.size, updatedAt: stat.mtime.toISOString() });
  } catch (err) { return fail(err); }
}

export function deleteFile(filePath, options = {}) {
  try {
    const abs = path.resolve(filePath);
    if (!fs.existsSync(abs)) return fail(`File not found: ${abs}`);
    if (!fs.statSync(abs).isFile()) return fail(`Not a file: ${abs}`);
    const backedUpTo = options.skipBackup ? null : makeBackup(abs);
    fs.unlinkSync(abs);
    return ok({ operation: 'DELETE', path: abs, backedUpTo,
      deletedAt: new Date().toISOString() });
  } catch (err) { return fail(err); }
}

export function listFiles(dirPath, options = {}) {
  try {
    const abs = path.resolve(dirPath);
    if (!fs.existsSync(abs)) return fail(`Directory not found: ${abs}`);
    if (!fs.statSync(abs).isDirectory()) return fail(`Not a directory: ${abs}`);
    function walk(dir) {
      const files = [];
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory() && options.recursive) files.push(...walk(full));
        else if (entry.isFile()) {
          if (!options.extension || path.extname(entry.name) === options.extension) {
            const stat = fs.statSync(full);
            files.push({ name: entry.name, path: full, sizeBytes: stat.size,
              extension: path.extname(entry.name) || '(none)',
              lastModified: stat.mtime.toISOString() });
          }
        }
      }
      return files;
    }
    const files = walk(abs);
    return ok({ operation: 'LIST', directory: abs, totalFiles: files.length, files });
  } catch (err) { return fail(err); }
}

function printResult(result) {
  if (!result.success) { Logger.error(result.error); return; }
  const d = result.data;
  console.log('\n' + Theme.success(`  ✔  ${d.operation}`) + '  ' + Theme.dim(d.path || d.directory || ''));
  for (const [k, v] of Object.entries(d)) {
    if (k === 'operation') continue;
    if (k === 'content') {
      console.log('\n' + Theme.primary.bold('  ── File Content ──'));
      v.split('\n').forEach((l, i) =>
        console.log(Theme.dim(`  ${String(i+1).padStart(4)}  `) + l));
    } else if (k === 'files' && Array.isArray(v)) {
      console.log('\n' + Theme.primary.bold(`  ── Files (${d.totalFiles}) ──`));
      v.forEach(f => console.log(
        `  ${Theme.success(f.name.padEnd(30))}  ${Theme.dim(formatBytes(f.sizeBytes))}  ${Theme.dim(f.lastModified)}`
      ));
    } else {
      console.log(`  ${Theme.primary(String(k).padEnd(20))}  ${typeof v === 'object' ? JSON.stringify(v) : v}`);
    }
  }
  console.log();
}

export default async function runCRUD() {
  console.log('\n' + Theme.secondary.bold('=== FILE CRUD MANAGER ==='));
  console.log(Theme.dim('  Destructive operations auto-backup before modifying.\n'));

  let running = true;
  while (running) {
    const { action } = await inquirer.prompt([{
      type: 'list', name: 'action',
      message: Theme.primary('Select an operation:'),
      choices: [
        { name: '📄  CREATE  — write a new code file',            value: 'create' },
        { name: '📖  READ    — view file content + metadata',     value: 'read'   },
        { name: '✏️   UPDATE  — overwrite or transform a file',    value: 'update' },
        { name: '🗑️   DELETE  — remove file (auto-backed up)',     value: 'delete' },
        { name: '📁  LIST    — list files in a directory',        value: 'list'   },
        new inquirer.Separator(),
        { name: '← Exit',                                         value: 'exit'   },
      ]
    }]);

    if (action === 'exit') { running = false; break; }

    if (action === 'create') {
      const { filePath, content } = await inquirer.prompt([
        { type: 'input', name: 'filePath',
          message: 'File path to create:', default: './output/new-file.js' },
        { type: 'editor', name: 'content', message: 'File content (opens editor):' }
      ]);
      printResult(createFile(filePath, content));

    } else if (action === 'read') {
      const { filePath } = await inquirer.prompt([
        { type: 'input', name: 'filePath', message: 'File path to read:' }
      ]);
      printResult(readFile(filePath));

    } else if (action === 'update') {
      const { filePath } = await inquirer.prompt([
        { type: 'input', name: 'filePath', message: 'File path to update:' }
      ]);
      const existing = readFile(filePath);
      if (!existing.success) { printResult(existing); continue; }
      console.log('\n' + Theme.dim('Current content preview (first 10 lines):'));
      existing.data.content.split('\n').slice(0, 10)
        .forEach((l, i) => console.log(Theme.dim(`  ${i+1}  ${l}`)));
      if (existing.data.lines > 10)
        console.log(Theme.dim(`  ... (${existing.data.lines - 10} more lines)`));
      const { newContent } = await inquirer.prompt([{
        type: 'editor', name: 'newContent',
        message: 'New content (opens editor):',
        default: existing.data.content
      }]);
      printResult(updateFile(filePath, newContent));

    } else if (action === 'delete') {
      const { filePath } = await inquirer.prompt([
        { type: 'input', name: 'filePath', message: 'File path to delete:' }
      ]);
      const { confirmed } = await inquirer.prompt([{
        type: 'confirm', name: 'confirmed',
        message: Theme.warning(`Delete "${filePath}"? (a .bak backup is created first)`),
        default: false
      }]);
      if (confirmed) printResult(deleteFile(filePath));
      else console.log(Theme.dim('\n  Cancelled.\n'));

    } else if (action === 'list') {
      const { dirPath, recursive, ext } = await inquirer.prompt([
        { type: 'input', name: 'dirPath', message: 'Directory to list:', default: '.' },
        { type: 'confirm', name: 'recursive', message: 'List recursively?', default: false },
        { type: 'input', name: 'ext',
          message: 'Filter by extension (e.g. .js) or leave blank:', default: '' }
      ]);
      printResult(listFiles(dirPath, { recursive, extension: ext.trim() || undefined }));
    }
  }
  Logger.success('CRUD session ended.');
}
