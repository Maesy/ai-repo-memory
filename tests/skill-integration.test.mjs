import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const ownSkills = ['find-repo-knowledge', 'record-decision', 'refresh-repo-knowledge', 'validate-knowledge'];
const starterTests = [
  'tests/knowledge-hooks.test.mjs',
  'tests/knowledge-index.test.mjs',
  'tests/skill-integration.test.mjs',
];
const adoptionChild = process.env.AI_REPO_MEMORY_ADOPTION_CHILD === '1';

async function directories(relative) {
  return (await fs.readdir(path.join(root, relative), { withFileTypes: true }))
    .filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

function run(script, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(root, script), ...args], { cwd: root, windowsHide: true });
    let stderr = '';
    child.stderr.on('data', (chunk) => stderr += chunk);
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr)));
  });
}

function runProcess(script, args, cwd, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, windowsHide: true, ...options });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => stdout += chunk);
    child.stderr.on('data', (chunk) => stderr += chunk);
    child.on('error', reject);
    child.on('close', (code) => resolve({ code, stdout, stderr }));
  });
}

test('the four repository skills exist and every canonical skill has a matching adapter', async () => {
  const canonicalNames = await directories('.agents/skills');
  const adapterNames = await directories('.claude/skills');
  assert.ok(ownSkills.every((name) => canonicalNames.includes(name)));
  assert.deepEqual(adapterNames, canonicalNames);
  for (const name of ownSkills) {
    const canonical = await fs.readFile(path.join(root, '.agents/skills', name, 'SKILL.md'), 'utf8');
    const adapter = await fs.readFile(path.join(root, '.claude/skills', name, 'SKILL.md'), 'utf8');
    const frontmatter = canonical.match(/^---\n[\s\S]*?\n---\n/)[0];
    assert.ok(adapter.startsWith(frontmatter));
    assert.match(adapter, new RegExp(`\.agents/skills/${name}/SKILL\\.md`));
  }
  await run('.agents/scripts/sync-claude-skill-adapters.mjs', ['--check']);
});

test('starter-owned executable helpers use only mjs', async () => {
  const executableExtensions = new Set(['.py', '.sh', '.ps1', '.js', '.cjs', '.ts']);
  const offenders = [];
  async function visit(relative) {
    for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (executableExtensions.has(path.extname(entry.name))) offenders.push(child);
    }
  }
  await visit('.agents/scripts');
  for (const name of ownSkills) await visit(path.join('.agents/skills', name));
  assert.deepEqual(offenders, []);
  assert.ok(starterTests.every((file) => path.extname(file) === '.mjs'));
});

test('knowledge layout is shallow and legacy directory is absent', async () => {
  for (const file of ['docs/INDEX.md', 'docs/README.md', 'docs/governance.md', 'docs/adr/.gitkeep', 'docs/pdr/.gitkeep', 'docs/prd/.gitkeep', '.nvmrc']) {
    assert.ok((await fs.stat(path.join(root, file))).isFile(), file);
  }
  await assert.rejects(fs.access(path.join(root, 'docs/knowledge')));
  await assert.rejects(fs.access(path.join(root, '.agents/hooks')));
  const routing = await fs.readFile(path.join(root, 'docs/README.md'), 'utf8');
  assert.match(routing, /## Miért lapos a szerkezet\?/);
  assert.match(routing, /docs\/knowledge\/.*nem része a starternek/s);
  assert.equal((await fs.readFile(path.join(root, '.nvmrc'), 'utf8')).trim(), '24');
});

test('starter checks tolerate application-owned package, tests and docs', { skip: adoptionChild }, async (t) => {
  const temporaryRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'repo-memory-adoption-'));
  t.after(() => fs.rm(temporaryRoot, { recursive: true, force: true }));
  const fixture = path.join(temporaryRoot, 'project');
  await fs.cp(root, fixture, {
    recursive: true,
    filter: (source) => !['.git', '.serena', '.agent-runtime'].includes(path.basename(source)),
  });
  await fs.writeFile(path.join(fixture, 'package.json'), `${JSON.stringify({ private: true, type: 'module' })}\n`);
  await fs.writeFile(path.join(fixture, 'tests/application.test.ts'), 'export const applicationTest = true;\n');
  await fs.writeFile(path.join(fixture, 'tests/application-helper.js'), 'export const helper = true;\n');
  await fs.writeFile(
    path.join(fixture, 'docs/application-notes.md'),
    '# Application notes\n\nOptional project-specific library.\n',
  );

  const result = await runProcess(
    path.join(fixture, 'tests/skill-integration.test.mjs'),
    [],
    fixture,
    { env: { ...process.env, AI_REPO_MEMORY_ADOPTION_CHILD: '1' } },
  );
  assert.equal(result.code, 0, result.stdout + result.stderr);
});

test('CI runs every repository check on three operating systems', async () => {
  const workflow = await fs.readFile(path.join(root, '.github/workflows/validate-starter.yml'), 'utf8');
  assert.match(workflow, /ubuntu-latest/);
  assert.match(workflow, /windows-latest/);
  assert.match(workflow, /macos-latest/);
  assert.match(workflow, /sync-claude-skill-adapters\.mjs --check/);
  assert.match(workflow, /update-index\.mjs --check/);
  assert.ok(workflow.includes(`run: node --test ${starterTests.join(' ')}`));
  assert.match(workflow, /node-version-file:\s*\.nvmrc/);
  assert.doesNotMatch(workflow, /uses:\s*actions\/(?:checkout|setup-node)@v\d/);
});

test('Copilot skill discovery contract is explicit and avoids deprecated routing', async () => {
  const setup = await fs.readFile(path.join(root, 'docs/agent-setup.md'), 'utf8');
  const compatibility = await fs.readFile(path.join(root, 'docs/agents/skill-compatibility.md'), 'utf8');
  const vscode = JSON.parse(await fs.readFile(path.join(root, '.vscode/settings.json'), 'utf8'));
  assert.match(setup, /VS Code 1\.125/);
  assert.match(compatibility, /első azonos nevű projekt-skill nyer/);
  assert.match(compatibility, /\.agents\/skills\/.*megelőzi.*\.claude\/skills\//s);
  assert.equal(vscode['chat.agentSkillsLocations']['.agents/skills'], true);
  assert.equal(vscode['chat.agentSkillsLocations']['.claude/skills'], false);
});

test('optional canonical skill generates a Claude adapter without mutating check mode', async (t) => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-adapter-á-'));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));
  const script = path.join(fixture, '.agents/scripts/sync-claude-skill-adapters.mjs');
  const skill = path.join(fixture, '.agents/skills/optional-engineering/SKILL.md');
  await fs.mkdir(path.dirname(script), { recursive: true });
  await fs.mkdir(path.dirname(skill), { recursive: true });
  await fs.copyFile(path.join(root, '.agents/scripts/sync-claude-skill-adapters.mjs'), script);
  await fs.writeFile(skill, '---\nname: optional-engineering\ndescription: Test skill.\n---\n\n# Optional\n');

  assert.equal((await runProcess(script, ['--check'], fixture)).code, 1);
  await assert.rejects(fs.access(path.join(fixture, '.claude')));
  assert.equal((await runProcess(script, ['--write'], fixture)).code, 0);
  assert.equal((await runProcess(script, ['--check'], fixture)).code, 0);
  const adapter = await fs.readFile(path.join(fixture, '.claude/skills/optional-engineering/SKILL.md'), 'utf8');
  assert.match(adapter, /\.agents\/skills\/optional-engineering\/SKILL\.md/);
});

test('adapter generator rejects a linked Claude parent', async (t) => {
  const fixture = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-adapter-root-á-'));
  const outside = await fs.mkdtemp(path.join(os.tmpdir(), 'skill-adapter-outside-á-'));
  t.after(() => fs.rm(fixture, { recursive: true, force: true }));
  t.after(() => fs.rm(outside, { recursive: true, force: true }));
  const script = path.join(fixture, '.agents/scripts/sync-claude-skill-adapters.mjs');
  const skill = path.join(fixture, '.agents/skills/demo/SKILL.md');
  await fs.mkdir(path.dirname(script), { recursive: true });
  await fs.mkdir(path.dirname(skill), { recursive: true });
  await fs.copyFile(path.join(root, '.agents/scripts/sync-claude-skill-adapters.mjs'), script);
  await fs.writeFile(skill, '---\nname: demo\ndescription: Test.\n---\n\n# Demo\n');
  await fs.symlink(outside, path.join(fixture, '.claude'), process.platform === 'win32' ? 'junction' : 'dir');

  const result = await runProcess(script, ['--write'], fixture);
  assert.equal(result.code, 1);
  assert.match(result.stderr, /local directory|linked/i);
  assert.deepEqual(await fs.readdir(outside), []);
});

test('relative Markdown navigation resolves inside the repository', async () => {
  const files = [];
  async function visit(relative) {
    for (const entry of await fs.readdir(path.join(root, relative), { withFileTypes: true })) {
      if (['.git', '.serena', '.agent-runtime'].includes(entry.name)) continue;
      const child = path.join(relative, entry.name);
      if (entry.isDirectory()) await visit(child);
      else if (path.extname(entry.name).toLowerCase() === '.md') files.push(child);
    }
  }
  await visit('.');
  for (const file of files) {
    const source = await fs.readFile(path.join(root, file), 'utf8');
    for (const match of source.matchAll(/\[(?:\\.|[^\]\\])*\]\(([^)]+)\)/g)) {
      const href = match[1];
      if (/^(https?:|#)/.test(href)) continue;
      const decoded = decodeURIComponent(href.split(/[?#]/, 1)[0]);
      assert.ok(!path.isAbsolute(decoded), `${file} has an absolute link: ${href}`);
      const target = path.resolve(root, path.dirname(file), decoded);
      assert.ok(target.startsWith(path.resolve(root) + path.sep), `${file} escapes the repository: ${href}`);
      await fs.access(target).catch(() => assert.fail(`${file} has a missing link: ${href}`));
    }
  }
});
