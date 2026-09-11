import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'repo knowledge á-'));
  t.after(async () => {
    assert.ok(root.startsWith(path.join(os.tmpdir(), 'repo knowledge á-')));
    await fs.rm(root, { recursive: true, force: true });
  });
  await fs.mkdir(path.join(root, '.agents/skills/refresh-repo-knowledge/scripts'), { recursive: true });
  await fs.mkdir(path.join(root, 'docs/knowledge'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/nested'), { recursive: true });
  for (const entry of ["knowledge", "claude", "codex"]) await fs.copyFile(new URL('../.agents/skills/refresh-repo-knowledge/scripts/' + entry + '.mjs', import.meta.url), path.join(root, '.agents/skills/refresh-repo-knowledge/scripts/' + entry + '.mjs'));
  await fs.writeFile(path.join(root, 'docs/project.md'), '# Fixture project');
  await fs.writeFile(path.join(root, 'docs/knowledge/INDEX.md'), '# Index');
  const write = (text) => fs.writeFile(path.join(root, 'docs/knowledge/decision.md'), text);
  const run = (name, overrides = {}, vendor = 'claude', args = null) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args ?? [path.join(root, '.agents/skills/refresh-repo-knowledge/scripts/' + vendor + '.mjs')], { cwd: root, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (c) => stdout += c); child.stderr.on('data', (c) => stderr += c);
    child.on('error', reject);
    child.on('close', (code) => { try { assert.equal(code, 0, stderr); resolve(stdout ? JSON.parse(stdout) : null); } catch (e) { reject(e); } });
    child.stdin.end(JSON.stringify({ hook_event_name: name, cwd: root, session_id: 'fixture-session', ...overrides }));
  });
  return { root, write, run };
}

function assertRefreshEvents(config) {
  assert.deepEqual(Object.keys(config.hooks), ['SessionStart', 'UserPromptSubmit', 'PostToolUse']);
  assert.equal(config.hooks.PostToolUse[0].matcher, 'Write|Edit');
  assert.equal(config.hooks.SessionStart[0].matcher, undefined);
  assert.equal(config.hooks.UserPromptSubmit[0].matcher, undefined);
}

test('startup requests source refresh; unchanged tool calls stay quiet', async (t) => {
  const hookFixture = await fixture(t);
  assert.match((await hookFixture.run('SessionStart')).hookSpecificOutput.additionalContext, /refresh-repo-knowledge\/SKILL.md/);
  assert.equal(await hookFixture.run('PostToolUse'), null);
  assert.equal(await hookFixture.run('UserPromptSubmit'), null);
});
test('external create, edit and delete each route through the refresh skill without injecting source text', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart');
  for (const content of ['UNTRUSTED_SOURCE_TEXT v1', 'UNTRUSTED_SOURCE_TEXT v2', null]) {
    if (content === null) await fs.unlink(path.join(hookFixture.root, 'docs/knowledge/decision.md')); else await hookFixture.write(content);
    const result = await hookFixture.run('PostToolUse');
    assert.match(result.hookSpecificOutput.additionalContext, /refresh-repo-knowledge\/SKILL\.md/);
    assert.match(result.hookSpecificOutput.additionalContext, /Hook event: PostToolUse/);
    assert.doesNotMatch(JSON.stringify(result), /UNTRUSTED_SOURCE_TEXT/);
    assert.equal(await hookFixture.run('PostToolUse'), null);
  }
});
test('vendors, sessions and subagents keep independent state', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart');
  for (const [overrides, vendor] of [[{ session_id: 'second' }, 'claude'], [{}, 'codex'], [{ agent_id: 'sub' }, 'claude']])
    assert.ok((await hookFixture.run('PostToolUse', overrides, vendor)).hookSpecificOutput);
});
test('resume and compaction request reads even when file hashes are unchanged', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart');
  for (const source of ['resume', 'compact']) assert.ok((await hookFixture.run('SessionStart', { source })).hookSpecificOutput);
});
test('Stop is no longer a registered event and never produces output', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart'); await hookFixture.write('Version 1');
  for (const vendor of ['claude', 'codex'])
    assert.equal(await hookFixture.run('Stop', { stop_hook_active: false }, vendor), null);
  // The pending change is still offered at the next registered event.
  assert.ok((await hookFixture.run('UserPromptSubmit')).hookSpecificOutput);
});
test('unrelated changes do not notify, and every notice uses additionalContext', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart');
  await fs.writeFile(path.join(hookFixture.root, 'src/code.txt'), 'change');
  assert.equal(await hookFixture.run('PostToolUse'), null);
  await hookFixture.write('updated');
  const response = await hookFixture.run('PostToolUse');
  assert.equal(response.hookSpecificOutput.hookEventName, 'PostToolUse');
  assert.equal(response.decision, undefined);
  assert.match(response.hookSpecificOutput.additionalContext, /refresh-repo-knowledge\/SKILL\.md/);
});
test('a session start notice asks for source reading, not for index maintenance', async (t) => {
  const hookFixture = await fixture(t);
  const context = (await hookFixture.run('SessionStart')).hookSpecificOutput.additionalContext;
  assert.match(context, /refresh-repo-knowledge\/SKILL\.md/);
  assert.doesNotMatch(context, /update-index\.mjs/);
});
test('concurrent tool callbacks offer a changed revision once', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart'); await hookFixture.write('concurrent revision');
  const outputs = await Promise.all(Array.from({ length: 6 }, () => hookFixture.run('PostToolUse')));
  assert.equal(outputs.filter((x) => x?.hookSpecificOutput).length, 1);
  assert.ok(outputs.every((x) => !x?.systemMessage), JSON.stringify(outputs));
});
test('invalid identity and foreign cwd fail open without creating state', async (t) => {
  const hookFixture = await fixture(t);
  for (const input of [{ session_id: '' }, { cwd: os.tmpdir() }]) assert.ok((await hookFixture.run('PostToolUse', input)).systemMessage);
  await assert.rejects(fs.access(path.join(hookFixture.root, '.agent-runtime')));
});
test('linked runtime directory is rejected instead of writing outside the checkout', async (t) => {
  const hookFixture = await fixture(t);
  await fs.symlink(path.join(hookFixture.root, 'src'), path.join(hookFixture.root, '.agent-runtime'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.ok((await hookFixture.run('SessionStart')).systemMessage);
  assert.deepEqual(await fs.readdir(path.join(hookFixture.root, 'src')), ['nested']);
});
test('Codex config registers the three stateful refresh events', async () => {
  const config = JSON.parse(await fs.readFile(new URL('../.codex/hooks.json', import.meta.url), 'utf8'));
  assertRefreshEvents(config);
  for (const event of Object.values(config.hooks)) {
    assert.match(event[0].hooks[0].command, /refresh-repo-knowledge\/scripts\/codex\.mjs/);
    assert.equal(event[0].hooks[0].commandWindows, event[0].hooks[0].command);
  }
});
test('Claude config registers three events and scopes PostToolUse to file writes', async () => {
  const config = JSON.parse(await fs.readFile(new URL('../.claude/settings.json', import.meta.url), 'utf8'));
  assertRefreshEvents(config);
  for (const [name, group] of Object.entries(config.hooks)) {
    assert.equal(group[0].hooks[0].command, 'node', name);
    assert.match(group[0].hooks[0].args[0], /refresh-repo-knowledge\/scripts\/claude\.mjs$/);
  }
});
test('shared hook state has no Stop bookkeeping', async () => {
  const source = await fs.readFile(new URL('../.agents/skills/refresh-repo-knowledge/scripts/knowledge.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /stopUsed|stopBlocked/);
});
test('Codex configured launcher resolves a workspace from a nested cwd', async (t) => {
  const hookFixture = await fixture(t);
  const config = JSON.parse(await fs.readFile(new URL('../.codex/hooks.json', import.meta.url), 'utf8'));
  const command = config.hooks.SessionStart[0].hooks[0].command;
  const code = command.match(/^node -e "(.*)"$/)[1];
  const response = await hookFixture.run('SessionStart', { cwd: path.join(hookFixture.root, 'src/nested') }, 'codex', ['-e', 'process.chdir(' + JSON.stringify(path.join(hookFixture.root, 'src/nested')) + ');' + code]);
  assert.ok(response.hookSpecificOutput);
});
test('corrupt state and orphan lock fail open and do not claim freshness', async (t) => {
  const hookFixture = await fixture(t); await hookFixture.run('SessionStart');
  const base = path.join(hookFixture.root, '.agent-runtime/knowledge-hooks');
  const directory = path.join(base, (await fs.readdir(base))[0]);
  await fs.writeFile(path.join(directory, 'state.json'), '{bad json');
  assert.ok((await hookFixture.run('PostToolUse')).systemMessage);
  await fs.writeFile(path.join(directory, 'lock'), '{"pid":0}');
  assert.ok((await hookFixture.run('PostToolUse')).systemMessage);
});
