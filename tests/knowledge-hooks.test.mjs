import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

const scripts = ['knowledge.mjs', 'claude.mjs', 'codex.mjs', 'copilot.mjs'];

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'knowledge-hook-á-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const target = path.join(root, '.agents/skills/refresh-repo-knowledge/scripts');
  await fs.mkdir(target, { recursive: true });
  for (const name of scripts) await fs.copyFile(new URL(`../.agents/skills/refresh-repo-knowledge/scripts/${name}`, import.meta.url), path.join(target, name));
  await fs.mkdir(path.join(root, 'docs/agents'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/nested'), { recursive: true });
  await fs.writeFile(path.join(root, 'docs/project.md'), '# Project\n', 'utf8');
  await fs.writeFile(path.join(root, 'docs/README.md'), '# Routing\n', 'utf8');
  await fs.writeFile(path.join(root, 'docs/governance.md'), '# Governance\n', 'utf8');
  await fs.writeFile(path.join(root, 'docs/agents/policy.md'), '# Policy\n', 'utf8');

  const run = (name, overrides = {}, adapter = 'claude.mjs', cwd = root) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [path.join(target, adapter)], { cwd, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (chunk) => stdout += chunk);
    child.stderr.on('data', (chunk) => stderr += chunk);
    child.on('error', reject);
    child.on('close', (code) => {
      try { resolve({ code, value: stdout ? JSON.parse(stdout) : null, stderr }); }
      catch (error) { reject(error); }
    });
    child.stdin.end(JSON.stringify({ hook_event_name: name, cwd: root, session_id: 'fixture-session', ...overrides }));
  });
  const write = async (relative, content) => {
    const file = path.join(root, relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, content, 'utf8');
  };
  return { root, run, write };
}

test('startup offers refresh; unchanged later events stay quiet', async (t) => {
  const f = await fixture(t);
  const first = await f.run('SessionStart');
  assert.equal(first.code, 0);
  assert.match(first.value.hookSpecificOutput.additionalContext, /refresh-repo-knowledge\/SKILL\.md/);
  assert.equal((await f.run('UserPromptSubmit')).value, null);
  assert.equal((await f.run('PostToolUse')).value, null);
});

test('create edit and delete of watched knowledge each offer one refresh', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  for (const content of ['# V1\n', '# V2\n', null]) {
    const file = path.join(f.root, 'docs/adr/decision.md');
    if (content === null) await fs.unlink(file);
    else await f.write('docs/adr/decision.md', content);
    const changed = await f.run('PostToolUse');
    assert.match(changed.value.hookSpecificOutput.additionalContext, /PostToolUse/);
    assert.doesNotMatch(JSON.stringify(changed.value), /# V[12]/);
    assert.equal((await f.run('PostToolUse')).value, null);
  }
});

test('unwatched changes and unsupported events stay quiet', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  await f.write('src/code.txt', 'changed');
  assert.equal((await f.run('PostToolUse')).value, null);
  await f.write('docs/adr/decision.md', '# Changed\n');
  assert.equal((await f.run('Stop')).value, null);
  assert.ok((await f.run('UserPromptSubmit')).value.hookSpecificOutput);
});

test('concurrent callbacks publish a changed revision once', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  await f.write('docs/prd/requirement.md', '# Concurrent\n');
  const results = await Promise.all(Array.from({ length: 12 }, () => f.run('PostToolUse')));
  assert.equal(results.filter((item) => item.value?.hookSpecificOutput).length, 1);
  assert.ok(results.every((item) => !item.value?.systemMessage), JSON.stringify(results));
});

test('shared state map retains only the 64 most recent agent states', async (t) => {
  const f = await fixture(t);
  for (let index = 0; index < 72; index += 1) {
    const result = await f.run('SessionStart', { session_id: `fixture-session-${index}` });
    assert.ok(result.value?.hookSpecificOutput);
  }

  const stateRoot = path.join(f.root, '.agent-runtime/knowledge-hooks');
  assert.deepEqual(await fs.readdir(stateRoot), ['state.json']);
  const state = JSON.parse(await fs.readFile(path.join(stateRoot, 'state.json'), 'utf8'));
  assert.equal(state.schema, 2);
  assert.equal(Object.keys(state.sessions).length, 64);
});

test('invalid identity and foreign cwd fail open without claiming refresh', async (t) => {
  const f = await fixture(t);
  for (const overrides of [{ session_id: '' }, { cwd: os.tmpdir() }]) {
    const result = await f.run('PostToolUse', overrides);
    assert.match(result.value.systemMessage, /could not check freshness/);
  }
});

test('Claude and Codex configs register the same three events', async () => {
  const claude = JSON.parse(await fs.readFile(new URL('../.claude/settings.json', import.meta.url), 'utf8'));
  const codex = JSON.parse(await fs.readFile(new URL('../.codex/hooks.json', import.meta.url), 'utf8'));
  for (const config of [claude, codex]) {
    assert.deepEqual(Object.keys(config.hooks), ['SessionStart', 'UserPromptSubmit', 'PostToolUse']);
    assert.equal(config.hooks.PostToolUse[0].matcher, 'Write|Edit');
  }
  for (const group of Object.values(claude.hooks)) {
    assert.equal(group[0].hooks[0].command, 'node');
    assert.match(group[0].hooks[0].args[0], /scripts\/claude\.mjs$/);
  }
  for (const group of Object.values(codex.hooks)) {
    assert.match(group[0].hooks[0].command, /scripts\/codex\.mjs/);
    assert.equal(group[0].hooks[0].commandWindows, group[0].hooks[0].command);
  }
});

test('Codex adapter works from a nested working directory', async (t) => {
  const f = await fixture(t);
  const result = await f.run('SessionStart', {}, 'codex.mjs', path.join(f.root, 'src/nested'));
  assert.ok(result.value.hookSpecificOutput);
});

test('every declared root knowledge route triggers a refresh', async (t) => {
  const watched = [
    'docs/project.md',
    'docs/README.md',
    'docs/governance.md',
    'docs/agents/watch.md',
    'docs/adr/watch.md',
    'docs/pdr/watch.md',
    'docs/prd/watch.md',
    'CONTEXT.md',
    'CONTEXT-MAP.md',
  ];
  for (const relative of watched) {
    await t.test(relative, async (child) => {
      const f = await fixture(child);
      await f.run('SessionStart');
      await f.write(relative, `# Changed ${relative}\n`);
      const changed = await f.run('PostToolUse');
      assert.ok(changed.value?.hookSpecificOutput, `${relative} was not watched`);
      assert.equal((await f.run('PostToolUse')).value, null);
    });
  }
});

test('component context and ADR routes trigger refresh', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  await f.write('src/ordering/CONTEXT.md', '# Ordering context\n');
  assert.ok((await f.run('PostToolUse')).value?.hookSpecificOutput);
  await f.write('src/ordering/docs/adr/0001-choice.md', '# Ordering choice\n');
  assert.ok((await f.run('PostToolUse')).value?.hookSpecificOutput);
});

test('expired hook lock is recovered safely', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  const stateRoot = path.join(f.root, '.agent-runtime/knowledge-hooks');
  const lock = path.join(stateRoot, 'lock');
  await fs.mkdir(lock);
  const owner = path.join(lock, 'owner.json');
  await fs.writeFile(owner, JSON.stringify({
    schema: 1,
    pid: 999999,
    token: 'expired',
    expiresAt: Date.now() + 60_000,
  }));
  const expired = new Date(Date.now() - 60_000);
  await fs.utimes(owner, expired, expired);
  const result = await f.run('UserPromptSubmit');
  assert.equal(result.code, 0);
  assert.equal(result.value, null);
  await assert.rejects(fs.access(lock));
});

test('busy shared state is quiet when the revision is already offered', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  const lock = path.join(f.root, '.agent-runtime/knowledge-hooks/lock');
  await fs.mkdir(lock);
  await fs.writeFile(path.join(lock, 'owner.json'), JSON.stringify({
    schema: 1,
    pid: process.pid,
    token: 'active',
    expiresAt: Date.now() + 60_000,
  }));

  const result = await f.run('UserPromptSubmit');
  assert.equal(result.code, 0);
  assert.equal(result.value, null);

  const resumed = await f.run('SessionStart');
  assert.equal(resumed.code, 0);
  assert.ok(resumed.value?.hookSpecificOutput);
  assert.equal(resumed.value.systemMessage, undefined);
});

test('busy shared state still offers an unrecorded revision', async (t) => {
  const f = await fixture(t);
  await f.run('SessionStart');
  await f.write('CONTEXT.md', '# Changed while another session owns the lock\n');
  const lock = path.join(f.root, '.agent-runtime/knowledge-hooks/lock');
  await fs.mkdir(lock);
  await fs.writeFile(path.join(lock, 'owner.json'), JSON.stringify({
    schema: 1,
    pid: process.pid,
    token: 'active',
    expiresAt: Date.now() + 60_000,
  }));

  const result = await f.run('UserPromptSubmit');
  assert.equal(result.code, 0);
  assert.ok(result.value?.hookSpecificOutput);
  assert.equal(result.value.systemMessage, undefined);
});

test('Copilot adapter emits compatible context and filters non-write tools', async (t) => {
  const f = await fixture(t);
  const startup = await f.run('SessionStart', {}, 'copilot.mjs');
  assert.match(startup.value.additionalContext, /REPO_KNOWLEDGE_REFRESH/);
  assert.equal(startup.value.additionalContext, startup.value.hookSpecificOutput.additionalContext);
  await f.write('CONTEXT.md', '# New context\n');
  assert.equal((await f.run('PostToolUse', { tool_name: 'read_file' }, 'copilot.mjs')).value, null);
  const changed = await f.run('PostToolUse', { tool_name: 'create_file' }, 'copilot.mjs');
  assert.match(changed.value.additionalContext, /REPO_KNOWLEDGE_REFRESH/);
});

test('Copilot uses one canonical skill source and native hook schema', async () => {
  const hooks = JSON.parse(await fs.readFile(new URL('../.github/hooks/repo-knowledge.json', import.meta.url), 'utf8'));
  const vscode = JSON.parse(await fs.readFile(new URL('../.vscode/settings.json', import.meta.url), 'utf8'));
  assert.equal(hooks.version, 1);
  assert.deepEqual(Object.keys(hooks.hooks), ['SessionStart', 'UserPromptSubmit', 'PostToolUse']);
  for (const group of Object.values(hooks.hooks)) {
    assert.equal(typeof group[0].command, 'string');
    assert.match(group[0].command, /scripts\/copilot\.mjs$/);
    assert.equal('args' in group[0], false);
  }
  assert.equal(hooks.hooks.PostToolUse[0].matcher, 'Edit|Write');
  assert.equal(vscode['chat.hookFilesLocations']['.github/hooks'], true);
  assert.equal(vscode['chat.hookFilesLocations']['.claude/settings.json'], false);
  assert.equal(vscode['chat.hookFilesLocations']['.claude/settings.local.json'], false);
  await assert.rejects(fs.access(new URL('../.github/skills', import.meta.url)));
});
