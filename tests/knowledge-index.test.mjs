import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const script = '.agents/skills/record-decision/scripts/update-index.mjs';
async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge index á-'));
  t.after(async () => {
    assert.ok(path.resolve(root).startsWith(path.join(os.tmpdir(), 'knowledge index á-')));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, path.dirname(script)), { recursive: true });
  await fs.mkdir(path.join(root, 'docs/knowledge'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/nested'), { recursive: true });
  await fs.copyFile(new URL('../' + script, import.meta.url), path.join(root, script));
  const write = async (file, text) => {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  };
  const run = (mode = '--check', cwd = root) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script), mode], { cwd, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (c) => stdout += c); child.stderr.on('data', (c) => stderr += c);
    child.on('error', reject); child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
  const index = () => fs.readFile(path.join(root, 'docs/knowledge/INDEX.md'), 'utf8');
  return { root, write, run, index };
}

test('check is read-only and detects a missing index; write generates an empty starter index', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.run()).code, 1);
  await assert.rejects(fs.access(path.join(f.root, '.agent-runtime')));
  await assert.rejects(f.index());
  assert.equal((await f.run('--write')).code, 0);
  assert.match(await f.index(), /Még nincs saját projektdokumentum/);
  assert.equal((await f.run()).code, 0);
});

test('titles come from source headings, with stable paths and without templates or root guides', async (t) => {
  const f = await fixture(t);
  await f.write('docs/knowledge/z.md', '---\nexample: |\n  # YAML example\n---\n```md\n# Code sample\n```\n# Real Z title\n');
  await f.write('docs/knowledge/a/record.md', '# A title\n');
  for (const file of ['docs/knowledge/README.md', 'docs/knowledge/governance.md', 'docs/templates/decision.md']) await f.write(file, '# Not a record');
  assert.equal((await f.run('--write')).code, 0);
  const index = await f.index();
  assert.match(index, /\[A title\]\(a\/record.md\)/);
  assert.match(index, /\[Real Z title\]\(z.md\)/);
  assert.ok(index.indexOf('[A title]') < index.indexOf('[Real Z title]'));
  assert.doesNotMatch(index, /YAML example|Code sample|Not a record/);
});

test('a second write does not rewrite an unchanged index; source files are never edited', async (t) => {
  const f = await fixture(t), source = '# Retained\n\nstatus: proposed\n';
  await f.write('docs/knowledge/record.md', source);
  await f.run('--write');
  const file = path.join(f.root, 'docs/knowledge/INDEX.md');
  await fs.utimes(file, new Date('2020-01-01'), new Date('2020-01-01'));
  const before = await fs.stat(file), content = await f.index();
  assert.equal((await f.run('--write')).code, 0);
  assert.equal((await fs.stat(file)).mtimeMs, before.mtimeMs);
  assert.equal(await f.index(), content);
  assert.equal(await fs.readFile(path.join(f.root, 'docs/knowledge/record.md'), 'utf8'), source);
});

test('HTML comment blocks cannot supply a title or open a code fence', async (t) => {
  const f = await fixture(t);
  const source = '<!--\n# Stale example title\n```md\n--> # Also hidden\n<!-- One-line comment -->\n# Real architecture decision\n';
  await f.write('docs/knowledge/decision.md', source);
  assert.equal((await f.run('--write')).code, 0);
  assert.match(await f.index(), /\[Real architecture decision\]\(decision.md\)/);
  assert.doesNotMatch(await f.index(), /Stale example|Also hidden/);
  assert.equal((await f.run()).code, 0);
  assert.equal(await fs.readFile(path.join(f.root, 'docs/knowledge/decision.md'), 'utf8'), source);
});

test('comment markers inside fenced code do not hide the real title', async (t) => {
  const f = await fixture(t);
  await f.write('docs/knowledge/decision.md', '```html\n<!-- Unclosed example comment\n# Example title\n```\n# Real title\n');
  assert.equal((await f.run('--write')).code, 0);
  assert.match(await f.index(), /\[Real title\]\(decision.md\)/);
});

test('a title inside a closed or unclosed comment cannot replace the existing index', async (t) => {
  const f = await fixture(t);
  await f.run('--write'); const before = await f.index();
  for (const source of ['<!--\n# Hidden title\n-->\n', '<!--\n# Hidden title\n']) {
    await f.write('docs/knowledge/decision.md', source);
    assert.equal((await f.run('--write')).code, 1);
    assert.equal(await f.index(), before);
    await assert.rejects(fs.access(path.join(f.root, '.agent-runtime/knowledge-index.lock')));
  }
});

test('create, rename, retitle and delete are reconciled without stale entries', async (t) => {
  const f = await fixture(t); await f.run('--write');
  await f.write('docs/knowledge/old.md', '# First title');
  assert.equal((await f.run()).code, 1); await f.run('--write');
  await fs.rename(path.join(f.root, 'docs/knowledge/old.md'), path.join(f.root, 'docs/knowledge/new.md'));
  assert.equal((await f.run()).code, 1); await f.run('--write');
  assert.doesNotMatch(await f.index(), /old.md/);
  await f.write('docs/knowledge/new.md', '# New title');
  assert.equal((await f.run()).code, 1); await f.run('--write');
  assert.match(await f.index(), /New title/);
  await fs.unlink(path.join(f.root, 'docs/knowledge/new.md'));
  assert.equal((await f.run()).code, 1); await f.run('--write');
  assert.doesNotMatch(await f.index(), /new.md|New title/);
});

test('body and approval changes do not duplicate source metadata in the navigation index', async (t) => {
  const f = await fixture(t); await f.write('docs/knowledge/a.md', '# A\nOld text'); await f.run('--write');
  const before = await f.index();
  await f.write('docs/knowledge/a.md', '---\nstatus: accepted\nversion: 2.0.0\n---\n# A\nNew text');
  assert.equal((await f.run()).code, 0);
  assert.equal(await f.index(), before);
  assert.doesNotMatch(before, /accepted|2.0.0/);
});

test('Unicode and special characters produce escaped labels and resolvable Markdown links', async (t) => {
  const f = await fixture(t), name = 'product/Ár #1 (50%).md';
  await f.write('docs/knowledge/' + name, '# Ár [terv] | <példa> & `kód`');
  assert.equal((await f.run('--write')).code, 0);
  const index = await f.index(), link = [...index.matchAll(/\]\(([^)]+)\)/g)].find((m) => m[1].startsWith('product/'))[1];
  assert.equal(decodeURIComponent(link), name);
  assert.match(index, /\\\[terv\\\] \\\| &lt;példa&gt; &amp;/);
});

test('invalid document preserves the old index and releases its writer lock', async (t) => {
  const f = await fixture(t); await f.run('--write'); const before = await f.index();
  await f.write('docs/knowledge/invalid.md', 'No document heading');
  assert.equal((await f.run('--write')).code, 1);
  assert.equal(await f.index(), before);
  await assert.rejects(fs.access(path.join(f.root, '.agent-runtime/knowledge-index.lock')));
});

test('source junctions, linked index and linked runtime paths are rejected', async (t) => {
  for (const target of ['source', 'index', 'runtime']) {
    const f = await fixture(t);
    if (target === 'index') {
      await f.write('src/external.md', '# Keep');
      // Directory junction also demonstrates that INDEX.md cannot redirect publication.
      await fs.symlink(path.join(f.root, 'src'), path.join(f.root, 'docs/knowledge/INDEX.md'), process.platform === 'win32' ? 'junction' : 'dir');
    } else await fs.symlink(path.join(f.root, 'src'), path.join(f.root, target === 'source' ? 'docs/knowledge/external' : '.agent-runtime'), process.platform === 'win32' ? 'junction' : 'dir');
    assert.equal((await f.run('--write')).code, 1);
    assert.deepEqual((await fs.readdir(path.join(f.root, 'src'))).sort(), target === 'index' ? ['external.md', 'nested'] : ['nested']);
  }
});

test('an existing writer lock is preserved and nested cwd resolves the actual repository', async (t) => {
  const f = await fixture(t);
  await f.write('.agent-runtime/knowledge-index.lock', 'another writer');
  assert.equal((await f.run('--write')).code, 1);
  assert.equal(await fs.readFile(path.join(f.root, '.agent-runtime/knowledge-index.lock'), 'utf8'), 'another writer');
  await fs.unlink(path.join(f.root, '.agent-runtime/knowledge-index.lock'));
  assert.equal((await f.run('--write', path.join(f.root, 'src/nested'))).code, 0);
  assert.equal((await f.run('--invalid')).code, 1);
});
