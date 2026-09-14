import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const script = '.agents/skills/record-decision/scripts/update-index.mjs';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge-index-á-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, path.dirname(script)), { recursive: true });
  await fs.mkdir(path.join(root, 'docs'), { recursive: true });
  await fs.copyFile(new URL(`../${script}`, import.meta.url), path.join(root, script));

  const run = (args = [], cwd = root) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script), ...args], { cwd, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => stdout += chunk);
    child.stderr.on('data', (chunk) => stderr += chunk);
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
  const write = async (relative, content) => {
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, 'utf8');
  };
  const index = () => fs.readFile(path.join(root, 'docs/INDEX.md'), 'utf8');
  return { root, run, write, index };
}

test('write creates an empty deterministic index and check is read-only', async (t) => {
  const f = await fixture(t);
  assert.equal((await f.run()).code, 1);
  await assert.rejects(fs.access(path.join(f.root, '.agent-runtime')));
  assert.equal((await f.run(['--write'])).code, 0);
  assert.match(await f.index(), /Még nincs saját projektdokumentum/);
  assert.equal((await f.run(['--check'])).code, 0);

  const file = path.join(f.root, 'docs/INDEX.md');
  await fs.utimes(file, new Date('2020-01-01'), new Date('2020-01-01'));
  const before = (await fs.stat(file)).mtimeMs;
  assert.equal((await f.run(['--write'])).code, 0);
  assert.equal((await fs.stat(file)).mtimeMs, before);
});

test('only ADR PDR PRD records are indexed by their first real H1', async (t) => {
  const f = await fixture(t);
  await f.write('docs/adr/z.md', '---\nexample: "# yaml"\n---\n```md\n# code\n```\n<!-- # comment -->\n# Real Z\n');
  await f.write('docs/prd/a.md', '# A title\n');
  await f.write('docs/README.md', '# Not a record\n');
  await f.write('docs/templates/decision.md', '# Not a record either\n');
  assert.equal((await f.run(['--write'])).code, 0);
  const index = await f.index();
  assert.match(index, /\[Real Z\]\(adr\/z.md\)/);
  assert.match(index, /\[A title\]\(prd\/a.md\)/);
  assert.ok(index.indexOf('adr/z.md') < index.indexOf('prd/a.md'));
  assert.doesNotMatch(index, /Not a record|# yaml|# code/);
});

test('special characters are escaped and paths are URL encoded', async (t) => {
  const f = await fixture(t);
  await f.write('docs/pdr/Ár #1 (50%).md', '# Ár [terv] | <példa> & `kód`\n');
  assert.equal((await f.run(['--write'])).code, 0);
  const index = await f.index();
  assert.match(index, /pdr\/%C3%81r%20%231%20%2850%25%29\.md/);
  assert.match(index, /Ár \\[terv\\] \\| &lt;példa&gt; &amp; \\`kód\\`/);
});

test('structural changes create drift; body-only changes do not', async (t) => {
  const f = await fixture(t);
  await f.write('docs/adr/one.md', '# One\nbody v1\n');
  await f.run(['--write']);
  const before = await f.index();
  await f.write('docs/adr/one.md', '# One\nbody v2\n');
  assert.equal((await f.run(['--check'])).code, 0);
  assert.equal(await f.index(), before);
  await f.write('docs/adr/one.md', '# Renamed\nbody v2\n');
  assert.equal((await f.run(['--check'])).code, 1);
  await f.run(['--write']);
  assert.match(await f.index(), /Renamed/);
  await fs.rename(path.join(f.root, 'docs/adr/one.md'), path.join(f.root, 'docs/adr/two.md'));
  assert.equal((await f.run(['--check'])).code, 1);
});

test('invalid records fail closed and preserve the previous index', async (t) => {
  const f = await fixture(t);
  await f.write('docs/adr/valid.md', '# Valid\n');
  await f.run(['--write']);
  const before = await f.index();
  await f.write('docs/prd/invalid.md', 'no heading\n');
  assert.equal((await f.run(['--write'])).code, 1);
  assert.equal(await f.index(), before);
  await assert.rejects(fs.access(path.join(f.root, '.agent-runtime/knowledge-index.lock')));
});

test('writer lock, nested cwd and invalid arguments are handled', async (t) => {
  const f = await fixture(t);
  await f.write('docs/adr/valid.md', 'missing heading\n');
  await f.write('.agent-runtime/knowledge-index.lock', 'other writer');
  const locked = await f.run(['--write']);
  assert.equal(locked.code, 1);
  assert.match(locked.stderr, /writer.*lock/i);
  await fs.unlink(path.join(f.root, '.agent-runtime/knowledge-index.lock'));
  await f.write('docs/adr/valid.md', '# Valid\n');
  const nested = path.join(f.root, 'src/nested');
  await fs.mkdir(nested, { recursive: true });
  assert.equal((await f.run(['--write'], nested)).code, 0);
  assert.equal((await f.run(['--invalid'])).code, 1);
});

test('component-scoped ADRs are indexed with repository-relative location', async (t) => {
  const f = await fixture(t);
  await f.write('src/ordering/CONTEXT.md', '# Ordering context\n');
  await f.write('src/ordering/docs/adr/0001-sequence.md', '# Sequence ownership\n');
  assert.equal((await f.run(['--write'])).code, 0);
  const index = await f.index();
  assert.match(index, /\[Sequence ownership\]\(\.\.\/src\/ordering\/docs\/adr\/0001-sequence\.md\)/);
  assert.match(index, /src\/ordering\/docs\/adr/);
  assert.equal((await f.run(['--check'])).code, 0);
});
