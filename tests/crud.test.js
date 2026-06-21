import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createFile, readFile, updateFile, deleteFile, listFiles }
  from '../src/services/crud.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TMP = path.join(__dirname, '..', 'output', 'test-tmp');
const SAMPLE = path.join(TMP, 'test-sample.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  \x1b[32m✔\x1b[0m  ${name}`); passed++; }
  catch(e) { console.error(`  \x1b[31m✖\x1b[0m  ${name}\n     ${e.message}`); failed++; }
}
function section(t) { console.log(`\n\x1b[36m── ${t} ──\x1b[0m`); }

if (fs.existsSync(TMP)) fs.rmSync(TMP, { recursive: true, force: true });

section('createFile');
test('creates file, returns success envelope', () => {
  const r = createFile(SAMPLE, '// hello');
  assert.ok(r.success, r.error);
  assert.ok(fs.existsSync(SAMPLE));
});
test('result has operation CREATE and sizeBytes', () => {
  const r = createFile(path.join(TMP,'meta.js'),'// x',{force:true});
  assert.strictEqual(r.data.operation, 'CREATE');
  assert.ok(typeof r.data.sizeBytes === 'number');
});
test('fails when file exists without force', () => {
  const r = createFile(SAMPLE, '// again');
  assert.ok(!r.success);
  assert.ok(r.error.includes('already exists'));
});
test('force:true overwrites', () => {
  const r = createFile(SAMPLE, '// forced', { force: true });
  assert.ok(r.success, r.error);
  assert.strictEqual(fs.readFileSync(SAMPLE, 'utf8'), '// forced');
});
test('auto-creates parent directories', () => {
  const r = createFile(path.join(TMP,'deep','nested','f.js'), '// deep');
  assert.ok(r.success, r.error);
});

section('readFile');
test('reads content and metadata', () => {
  const r = readFile(SAMPLE);
  assert.ok(r.success, r.error);
  assert.strictEqual(r.data.content, '// forced');
  assert.ok(typeof r.data.sizeBytes === 'number');
  assert.strictEqual(r.data.extension, '.js');
});
test('fails for non-existent file', () => {
  const r = readFile(path.join(TMP, 'ghost.js'));
  assert.ok(!r.success);
  assert.ok(r.error.includes('not found'));
});

section('updateFile');
test('replaces content with string', () => {
  const r = updateFile(SAMPLE, '// updated');
  assert.ok(r.success, r.error);
  assert.strictEqual(fs.readFileSync(SAMPLE, 'utf8'), '// updated');
});
test('accepts transform function', () => {
  const r = updateFile(SAMPLE, old => old + '\n// appended');
  assert.ok(r.success, r.error);
  assert.ok(fs.readFileSync(SAMPLE, 'utf8').includes('appended'));
});
test('creates .bak backup before mutating', () => {
  updateFile(SAMPLE, '// new content');
  assert.ok(fs.readdirSync(TMP).some(f => f.endsWith('.bak')));
});
test('result has previousLines and newLines', () => {
  const r = updateFile(SAMPLE, 'a\nb\nc');
  assert.ok(r.success, r.error);
  assert.ok(typeof r.data.previousLines === 'number');
  assert.strictEqual(r.data.newLines, 3);
});
test('fails for non-existent file', () => {
  const r = updateFile(path.join(TMP,'nope.js'), '// x');
  assert.ok(!r.success);
});

section('listFiles');
test('returns files with totalFiles count', () => {
  const r = listFiles(TMP);
  assert.ok(r.success, r.error);
  assert.ok(r.data.totalFiles >= 1);
  assert.ok(Array.isArray(r.data.files));
});
test('filters by extension', () => {
  const r = listFiles(TMP, { extension: '.js' });
  assert.ok(r.success, r.error);
  r.data.files.forEach(f => assert.ok(f.name.endsWith('.js')));
});
test('recursive finds nested files', () => {
  const r = listFiles(TMP, { recursive: true });
  assert.ok(r.data.files.some(f => f.path.includes('deep')));
});
test('fails for missing directory', () => {
  const r = listFiles(path.join(TMP, 'no-such-dir'));
  assert.ok(!r.success);
});

section('deleteFile');
test('deletes file and returns .bak path', () => {
  const r = deleteFile(SAMPLE);
  assert.ok(r.success, r.error);
  assert.ok(!fs.existsSync(SAMPLE));
  assert.ok(r.data.backedUpTo !== null);
  assert.ok(fs.existsSync(r.data.backedUpTo));
});
test('fails for already-deleted file', () => {
  const r = deleteFile(SAMPLE);
  assert.ok(!r.success);
});
test('skipBackup creates no new .bak', () => {
  createFile(path.join(TMP,'skip.txt'), 'x', { force: true });
  const pre = fs.readdirSync(TMP).filter(f => f.endsWith('.bak')).length;
  deleteFile(path.join(TMP,'skip.txt'), { skipBackup: true });
  const post = fs.readdirSync(TMP).filter(f => f.endsWith('.bak')).length;
  assert.strictEqual(pre, post);
});

console.log(`\n  \x1b[32m${passed} passed\x1b[0m, ${failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m\n`);
if (failed > 0) process.exit(1);
