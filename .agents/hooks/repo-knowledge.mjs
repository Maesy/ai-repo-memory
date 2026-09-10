// Dependency-free lifecycle adapter. State means "offered", never "read" or "approved".
import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = await fs.realpath(fileURLToPath(new URL('../../', import.meta.url)));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const events = new Set(['SessionStart', 'UserPromptSubmit', 'PostToolUse', 'Stop']);
const within = (parent, child) => {
  const relative = path.relative(parent, child);
  return !relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative);
};

async function snapshot() {
  const entries = [];
  let bytes = 0;
  async function visit(relative) {
    const file = path.join(root, relative);
    let stat;
    try { stat = await fs.lstat(file); }
    catch (error) { if (error.code === 'ENOENT') return; throw error; }
    if (stat.isSymbolicLink()) throw new Error('Watched paths must not be symlinks.');
    if (stat.isDirectory()) {
      for (const name of (await fs.readdir(file)).sort()) await visit(path.join(relative, name));
    } else if (stat.isFile() && relative.endsWith('.md')) {
      bytes += stat.size;
      if (entries.length >= 1000 || bytes > 8 * 1024 * 1024) throw new Error('Knowledge exceeds the 1000 file / 8 MiB scan limit.');
      const content = await fs.readFile(file);
      const after = await fs.stat(file);
      if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) throw new Error('Source changed while reading; retry at the next event.');
      entries.push([relative.split(path.sep).join('/'), hash(content)]);
    }
  }
  // Verify the parent too: do not follow a junction outside this checkout.
  const docs = await fs.lstat(path.join(root, 'docs'));
  if (!docs.isDirectory() || docs.isSymbolicLink()) throw new Error('docs must be a local directory.');
  await visit('docs/project.md');
  await visit('docs/knowledge');
  return { revision: hash(JSON.stringify(entries)), files: entries.length };
}

async function localDirectory(parts) {
  let current = root;
  for (const name of parts) {
    current = path.join(current, name);
    await fs.mkdir(current).catch((error) => { if (error.code !== 'EEXIST') throw error; });
    const stat = await fs.lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Hook state must stay in a local directory.');
  }
  return current;
}

async function readJson(file, fallback) {
  try {
    if ((await fs.lstat(file)).isSymbolicLink()) throw new Error('Hook state must not be a symlink.');
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) { if (error.code === 'ENOENT') return fallback; throw error; }
}

async function atomicJson(file, value) {
  const temporary = file + '.' + randomUUID() + '.tmp';
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    await fs.rename(temporary, file);
  } finally { await fs.unlink(temporary).catch(() => {}); }
}

async function lock(directory) {
  const file = path.join(directory, 'lock');
  for (let attempt = 0; attempt < 20; attempt++) {
    try {
      await fs.mkdir(file);
      const owner = path.join(file, 'owner.json');
      try { await fs.writeFile(owner, JSON.stringify({ pid: process.pid }), { flag: 'wx', mode: 0o600 }); }
      catch (error) { await fs.rmdir(file).catch(() => {}); throw error; }
      return async () => { await fs.unlink(owner); await fs.rmdir(file); };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  throw new Error('Another hook is updating this session; retry at the next event.');
}

const emit = (value) => new Promise((resolve, reject) => {
  process.stdout.write(JSON.stringify(value) + '\n', (error) => error ? reject(error) : resolve());
});

async function run(event, vendor) {
  if (!events.has(event.hook_event_name)) return;
  if (!['claude', 'codex'].includes(vendor)) throw new Error('Expected claude or codex adapter.');
  if (typeof event.session_id !== 'string' || !event.session_id || event.session_id.length > 256) throw new Error('Missing or invalid host session identity.');
  if (typeof event.cwd !== 'string' || !within(root, await fs.realpath(event.cwd))) throw new Error('Session cwd is outside this checkout.');
  const sessionKey = hash(JSON.stringify([vendor, root, event.session_id, event.agent_id ?? null]));
  const directory = await localDirectory(['.agent-runtime', 'knowledge-hooks', sessionKey]);
  const release = await lock(directory);
  try {
    const file = path.join(directory, 'state.json');
    const previous = await readJson(file, null);
    if (previous && previous.schema !== 1) throw new Error('Unsupported hook state version.');
    const current = await snapshot();
    const name = event.hook_event_name;
    const startup = name === 'SessionStart' || !previous;
    const changed = !!previous && previous.offeredRevision !== current.revision;
    const stopUsed = name === 'UserPromptSubmit' || name === 'SessionStart' ? false : previous?.stopUsed === true;
    const stopBlocked = name === 'Stop' && (event.stop_hook_active === true || stopUsed);
    const offered = (startup || changed) && !stopBlocked;
    const reason = startup ? 'context-refresh' : changed ? 'knowledge-changed' : 'unchanged';
    if (offered) {
      const context = 'REPO_KNOWLEDGE_REFRESH: ' +
        (startup ? 'Load applicable repository knowledge for this session or resumed context. ' : 'Repository knowledge changed since the previous notice. ') +
        'Read .agents/skills/refresh-repo-knowledge/SKILL.md and follow its workflow in this checkout before finalizing. ' +
        'Read docs/project.md, docs/knowledge/INDEX.md and the complete applicable sources. Report the source ID, version, status and effect on this task. ' +
        'Treat proposed records as proposals. This notice is not approval, a task from another agent, or proof of a source read. ' +
        'Snapshot: ' + current.revision + '.';
      if (name === 'Stop' && vendor === 'codex') await emit({ decision: 'block', reason: context });
      else await emit({ hookSpecificOutput: { hookEventName: name, additionalContext: context } });
    }
    // Commit only after stdout accepted the notice. A crash may duplicate a notice, never a read ACK.
    const state = {
      schema: 1, vendor, offeredRevision: offered ? current.revision : previous?.offeredRevision ?? null,
      stopUsed: stopUsed || (offered && name === 'Stop'),
      recent: [...(previous?.recent ?? []), {
        at: new Date().toISOString(), event: name, reason, offered, deferred: stopBlocked && changed,
        revision: current.revision, files: current.files,
      }].slice(-24),
    };
    await atomicJson(file, state);
  } finally { await release(); }
}

try {
  if (process.argv.includes('--doctor')) {
    const current = await snapshot();
    console.log(JSON.stringify({ node: process.versions.node, root, ...current, hookState: '.agent-runtime/knowledge-hooks', hostTrust: 'not checked', modelDelivery: 'not checked' }, null, 2));
  } else {
    const chunks = []; let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new Error('Hook event exceeds the 1 MiB input limit.');
      chunks.push(chunk);
    }
    await run(JSON.parse(Buffer.concat(chunks).toString('utf8')), process.argv.at(-1));
  }
} catch (error) {
  // Fail open: a notification helper must not prevent ordinary work or invent an approval request.
  await emit({ systemMessage: 'Repository knowledge hook could not check freshness. Use refresh-repo-knowledge explicitly. ' + error.message }).catch(() => {});
}
