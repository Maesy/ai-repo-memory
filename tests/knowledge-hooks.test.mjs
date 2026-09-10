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
  await fs.mkdir(path.join(root, '.agents/hooks'), { recursive: true });
  await fs.mkdir(path.join(root, 'docs/knowledge'), { recursive: true });
  await fs.mkdir(path.join(root, 'src/nested'), { recursive: true });
  await fs.copyFile(new URL('../.agents/hooks/repo-knowledge.mjs', import.meta.url), path.join(root, '.agents/hooks/repo-knowledge.mjs'));
  await fs.writeFile(path.join(root, 'docs/project.md'), '# Fixture project');
  await fs.writeFile(path.join(root, 'docs/knowledge/INDEX.md'), '# Index');
  const write = (text) => fs.writeFile(path.join(root, 'docs/knowledge/decision.md'), text);
  const run = (name, overrides = {}, vendor = 'claude', args = null) => new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args ?? [path.join(root, '.agents/hooks/repo-knowledge.mjs'), vendor], { cwd: root, windowsHide: true });
    let stdout = '', stderr = '';
    child.stdout.on('data', (c) => stdout += c); child.stderr.on('data', (c) => stderr += c);
    child.on('error', reject);
    child.on('close', (code) => { try { assert.equal(code, 0, stderr); resolve(stdout ? JSON.parse(stdout) : null); } catch (e) { reject(e); } });
    child.stdin.end(JSON.stringify({ hook_event_name: name, cwd: root, session_id: 'fixture-session', ...overrides }));
  });
  return { root, write, run };
}

test('startup requests source refresh; unchanged tool calls stay quiet', async (t) => {
  const f = await fixture(t);
  assert.match((await f.run('SessionStart')).hookSpecificOutput.additionalContext, /refresh-repo-knowledge\/SKILL.md/);
  assert.equal(await f.run('PostToolUse'), null);
  assert.equal(await f.run('UserPromptSubmit'), null);
});
test('external create, edit and delete each produce one notice without injecting source text', async (t) => {
  const f = await fixture(t); await f.run('SessionStart');
  for (const content of ['UNTRUSTED_SOURCE_TEXT v1', 'UNTRUSTED_SOURCE_TEXT v2', null]) {
    if (content === null) await fs.unlink(path.join(f.root, 'docs/knowledge/decision.md')); else await f.write(content);
    const result = await f.run('PostToolUse');
    assert.match(result.hookSpecificOutput.additionalContext, /knowledge changed/);
    assert.doesNotMatch(JSON.stringify(result), /UNTRUSTED_SOURCE_TEXT/);
    assert.equal(await f.run('PostToolUse'), null);
  }
});
test('vendors, sessions and subagents keep independent state', async (t) => {
  const f = await fixture(t); await f.run('SessionStart');
  for (const [overrides, vendor] of [[{ session_id: 'second' }, 'claude'], [{}, 'codex'], [{ agent_id: 'sub' }, 'claude']])
    assert.ok((await f.run('PostToolUse', overrides, vendor)).hookSpecificOutput);
});
test('resume and compaction request reads even when file hashes are unchanged', async (t) => {
  const f = await fixture(t); await f.run('SessionStart');
  for (const source of ['resume', 'compact']) assert.ok((await f.run('SessionStart', { source })).hookSpecificOutput);
});
test('Stop requests one continuation, defers a further change and picks it up next prompt', async (t) => {
  const f = await fixture(t); await f.run('SessionStart', {}, 'codex'); await f.write('Version 1');
  assert.equal((await f.run('Stop', { turn_id: 'turn1' }, 'codex')).decision, 'block');
  await f.write('Version 2');
  assert.equal(await f.run('Stop', { stop_hook_active: true, turn_id: 'turn1' }, 'codex'), null);
  assert.ok((await f.run('UserPromptSubmit', {}, 'codex')).hookSpecificOutput);
  assert.equal(await f.run('Stop', {}, 'codex'), null);
});
test('Claude Stop uses additionalContext, and unrelated changes do not notify', async (t) => {
  const f = await fixture(t); await f.run('SessionStart');
  await fs.writeFile(path.join(f.root, 'src/code.txt'), 'change');
  assert.equal(await f.run('PostToolUse'), null);
  await f.write('updated');
  const response = await f.run('Stop');
  assert.equal(response.hookSpecificOutput.hookEventName, 'Stop');
  assert.equal(response.decision, undefined);
});
test('concurrent tool callbacks offer a changed revision once', async (t) => {
  const f = await fixture(t); await f.run('SessionStart'); await f.write('concurrent revision');
  const outputs = await Promise.all(Array.from({ length: 6 }, () => f.run('PostToolUse')));
  assert.equal(outputs.filter((x) => x?.hookSpecificOutput).length, 1);
  assert.ok(outputs.every((x) => !x?.systemMessage), JSON.stringify(outputs));
});
test('invalid identity and foreign cwd fail open without creating state', async (t) => {
  const f = await fixture(t);
  for (const input of [{ session_id: '' }, { cwd: os.tmpdir() }]) assert.ok((await f.run('PostToolUse', input)).systemMessage);
  await assert.rejects(fs.access(path.join(f.root, '.agent-runtime')));
});
test('linked runtime directory is rejected instead of writing outside the checkout', async (t) => {
  const f = await fixture(t);
  await fs.symlink(path.join(f.root, 'src'), path.join(f.root, '.agent-runtime'), process.platform === 'win32' ? 'junction' : 'dir');
  assert.ok((await f.run('SessionStart')).systemMessage);
  assert.deepEqual(await fs.readdir(path.join(f.root, 'src')), ['nested']);
});
test('Codex configured launcher resolves a workspace from a nested cwd', async (t) => {
  const f = await fixture(t);
  const config = JSON.parse(await fs.readFile(new URL('../.codex/hooks.json', import.meta.url), 'utf8'));
  const command = config.hooks.SessionStart[0].hooks[0].command;
  const code = command.match(/^node -e "(.*)" codex$/)[1];
  const response = await f.run('SessionStart', { cwd: path.join(f.root, 'src/nested') }, 'codex', ['-e', 'process.chdir(' + JSON.stringify(path.join(f.root, 'src/nested')) + ');' + code, 'codex']);
  assert.ok(response.hookSpecificOutput);
});
test('corrupt state and orphan lock fail open and do not claim freshness', async (t) => {
  const f = await fixture(t); await f.run('SessionStart');
  const base = path.join(f.root, '.agent-runtime/knowledge-hooks');
  const directory = path.join(base, (await fs.readdir(base))[0]);
  await fs.writeFile(path.join(directory, 'state.json'), '{bad json');
  assert.ok((await f.run('PostToolUse')).systemMessage);
  await fs.writeFile(path.join(directory, 'lock'), '{"pid":0}');
  assert.ok((await f.run('PostToolUse')).systemMessage);
});
