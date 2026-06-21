import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { CrudService } from '../src/services/crudService.js';

const createFile = CrudService.create.bind(CrudService);
const readFile = CrudService.read.bind(CrudService);
const updateFile = CrudService.update.bind(CrudService);
const deleteFile = CrudService.delete.bind(CrudService);
const listFiles = CrudService.list.bind(CrudService);

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TMP = path.join(__dirname,'..','output','test-tmp');
const SAMPLE = path.join(TMP,'test-sample.js');

if (fs.existsSync(TMP)) {
  fs.rmSync(TMP, { recursive:true, force:true });
}

let passed = 0, failed = 0;
async function test(name, fn) {
  try { await fn(); console.log(`  \x1b[32m✔\x1b[0m  ${name}`); passed++; }
  catch(e) { console.error(`  \x1b[31m✖\x1b[0m  ${name}\n     ${e.stack}`); failed++; }
}
function section(t) { console.log(`\n\x1b[36m── ${t} ──\x1b[0m`); }

async function run() {
  section('createFile');
  await test('creates file and returns success envelope', async () => {
    const r = await createFile(SAMPLE,'// hello');
    assert.ok(r.success); assert.ok(fs.existsSync(SAMPLE));
  });

  await test('result has operation CREATE and sizeBytes', async () => {
    const r = await readFile(SAMPLE);
    // wait, the prompt says for CREATE result:
    // r = createFile(SAMPLE,'// hello')
    // assert r.data.operation === 'CREATE'; assert typeof r.data.sizeBytes === 'number'
    // Let me recreate exactly what the user wanted:
    fs.rmSync(SAMPLE, { force: true });
    const r2 = await createFile(SAMPLE,'// hello');
    assert.strictEqual(r2.data.operation, 'CREATE'); 
    assert.strictEqual(typeof r2.data.sizeBytes, 'number');
  });

  await test('returns error when file exists without force', async () => {
    const r = await createFile(SAMPLE,'// again');
    assert.ok(!r.success); assert.ok(r.error.includes('already exists'));
  });

  await test('force:true overwrites existing', async () => {
    const r = await createFile(SAMPLE,'// forced',{force:true});
    assert.ok(r.success); assert.strictEqual(fs.readFileSync(SAMPLE,'utf8'), '// forced');
  });

  await test('auto-creates parent directories', async () => {
    const r = await createFile(path.join(TMP,'deep','nested','f.js'),'// x');
    assert.ok(r.success); assert.ok(fs.existsSync(path.join(TMP,'deep','nested','f.js')));
  });

  section('readFile');
  await test('reads content and metadata', async () => {
    const r = await readFile(SAMPLE);
    assert.ok(r.success); assert.strictEqual(r.data.content, '// forced');
    assert.strictEqual(typeof r.data.sizeBytes, 'number');
    assert.strictEqual(r.data.extension, '.js');
    assert.strictEqual(typeof r.data.lines, 'number');
  });

  await test('returns error for non-existent file', async () => {
    const r = await readFile(path.join(TMP,'ghost.js'));
    assert.ok(!r.success); assert.ok(r.error.includes('not found'));
  });

  section('updateFile');
  await test('replaces content with string', async () => {
    const r = await updateFile(SAMPLE,'// updated');
    assert.ok(r.success); assert.strictEqual(fs.readFileSync(SAMPLE,'utf8'), '// updated');
  });

  await test('accepts transform function', async () => {
    const r = await updateFile(SAMPLE, old => old + '\n// appended');
    assert.ok(r.success); assert.ok(fs.readFileSync(SAMPLE,'utf8').includes('appended'));
  });

  await test('creates .bak backup before mutating', async () => {
    await updateFile(SAMPLE,'// new');
    assert.ok(fs.readdirSync(TMP).some(f => f.endsWith('.bak')));
  });

  await test('result has previousLines and newLines', async () => {
    const r = await updateFile(SAMPLE,'a\nb\nc');
    assert.strictEqual(typeof r.data.previousLines, 'number');
    assert.strictEqual(r.data.newLines, 3);
  });

  await test('returns error for non-existent file', async () => {
    const r = await updateFile(path.join(TMP,'nope.js'),'x');
    assert.ok(!r.success);
  });

  section('listFiles');
  await test('returns file list with totalFiles', async () => {
    const r = await listFiles(TMP);
    assert.ok(r.success); assert.ok(r.data.totalFiles >= 1);
    assert.ok(Array.isArray(r.data.files));
  });

  await test('filters by extension', async () => {
    const r = await listFiles(TMP,{extension:'.js'});
    assert.ok(r.success);
    r.data.files.forEach(f => assert.ok(f.name.endsWith('.js')));
  });

  await test('supports recursive listing', async () => {
    const r = await listFiles(TMP,{recursive:true});
    assert.ok(r.data.files.some(f => f.path.includes('deep')));
  });

  await test('returns error for missing directory', async () => {
    const r = await listFiles(path.join(TMP,'no-such-dir'));
    assert.ok(!r.success);
  });

  section('deleteFile');
  await test('deletes file and creates .bak backup', async () => {
    const r = await deleteFile(SAMPLE);
    assert.ok(r.success); assert.ok(!fs.existsSync(SAMPLE));
    assert.ok(r.data.backedUpTo !== null);
    assert.ok(fs.existsSync(r.data.backedUpTo));
  });

  await test('skipBackup skips backup creation', async () => {
    await createFile(path.join(TMP,'skip.txt'),'x',{force:true});
    const pre = fs.readdirSync(TMP).filter(f=>f.endsWith('.bak')).length;
    await deleteFile(path.join(TMP,'skip.txt'),{skipBackup:true});
    const post = fs.readdirSync(TMP).filter(f=>f.endsWith('.bak')).length;
    assert.strictEqual(pre, post);
  });

  console.log(`\n  Results: \x1b[32m${passed} passed\x1b[0m, ${
    failed > 0 ? '\x1b[31m' : ''}${failed} failed\x1b[0m\n`);
  if (failed > 0) process.exit(1);
}

run();
