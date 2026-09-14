#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = await fs.realpath(fileURLToPath(new URL('../../../../', import.meta.url)));
const supportedEvents = new Set(['SessionStart', 'UserPromptSubmit', 'PostToolUse']);
const baseWatchedPaths = [
  'docs/project.md',
  'docs/README.md',
  'docs/governance.md',
  'docs/agents',
  'docs/adr',
  'docs/pdr',
  'docs/prd',
  'CONTEXT.md',
  'CONTEXT-MAP.md',
];
const lockLeaseMs = 30_000;
const stateCapacity = 64;
const hash = (value) => createHash('sha256').update(value).digest('hex');

function within(parent, child) {
  const relative = path.relative(parent, child);
  return relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
}

async function componentWatchedPaths() {
  const sourceRoot = path.join(root, 'src');
  let sourceStat;
  try {
    sourceStat = await fs.lstat(sourceRoot);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
  if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) {
    throw new Error('src must be a local directory when it contains domain contexts.');
  }

  const result = [];
  for (const name of (await fs.readdir(sourceRoot)).sort()) {
    const component = path.join(sourceRoot, name);
    const componentStat = await fs.lstat(component);
    if (!componentStat.isDirectory() || componentStat.isSymbolicLink()) continue;
    result.push(path.join('src', name, 'CONTEXT.md'));

    const componentDocs = path.join(component, 'docs');
    let docsStat;
    try {
      docsStat = await fs.lstat(componentDocs);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (!docsStat.isDirectory() || docsStat.isSymbolicLink()) {
      throw new Error(`Context docs must be a local directory: src/${name}/docs`);
    }
    const adr = path.join(componentDocs, 'adr');
    let adrStat;
    try {
      adrStat = await fs.lstat(adr);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      throw error;
    }
    if (!adrStat.isDirectory() || adrStat.isSymbolicLink()) {
      throw new Error(`Context ADR path must be a local directory: src/${name}/docs/adr`);
    }
    result.push(path.join('src', name, 'docs', 'adr'));
  }
  return result;
}

async function snapshot() {
  const entries = [];
  let bytes = 0;

  async function visit(relative) {
    const file = path.join(root, relative);
    let stat;
    try {
      stat = await fs.lstat(file);
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    if (stat.isSymbolicLink()) throw new Error(`Watched path must not be linked: ${relative}`);
    if (stat.isDirectory()) {
      for (const name of (await fs.readdir(file)).sort()) await visit(path.join(relative, name));
      return;
    }
    if (!stat.isFile() || path.extname(relative).toLowerCase() !== '.md') return;
    bytes += stat.size;
    if (entries.length >= 1000 || bytes > 8 * 1024 * 1024) throw new Error('Knowledge exceeds the 1000 file / 8 MiB scan limit.');
    const content = await fs.readFile(file);
    const after = await fs.stat(file);
    if (after.size !== stat.size || after.mtimeMs !== stat.mtimeMs) throw new Error('Knowledge changed while reading; retry next event.');
    entries.push([relative.split(path.sep).join('/'), hash(content)]);
  }

  const docs = await fs.lstat(path.join(root, 'docs'));
  if (!docs.isDirectory() || docs.isSymbolicLink()) throw new Error('docs must be a local directory.');
  for (const relative of [...baseWatchedPaths, ...await componentWatchedPaths()]) await visit(relative);
  entries.sort(([left], [right]) => left.localeCompare(right, 'en'));
  return { revision: hash(JSON.stringify(entries)), files: entries.length };
}

async function localDirectory(parts) {
  let current = root;
  for (const name of parts) {
    current = path.join(current, name);
    await fs.mkdir(current).catch((error) => {
      if (error.code !== 'EEXIST') throw error;
    });
    const stat = await fs.lstat(current);
    if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Hook state must stay in local directories.');
  }
  return current;
}

async function readJson(file, fallback) {
  try {
    const stat = await fs.lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Hook state must be a local file.');
    return JSON.parse(await fs.readFile(file, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function atomicJson(file, value) {
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
    for (let attempt = 0; attempt <= 5; attempt += 1) {
      try {
        await fs.rename(temporary, file);
        return true;
      } catch (error) {
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code)) throw error;
        if (attempt === 5) return false;
        await new Promise((resolve) => setTimeout(resolve, 2 ** (attempt + 1)));
      }
    }
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}

async function recoverExpiredLock(lockDirectory) {
  let stat;
  try {
    stat = await fs.lstat(lockDirectory);
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Hook lock must be a local directory.');
  let entries;
  try {
    entries = await fs.readdir(lockDirectory);
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
  if (entries.length === 0) {
    if (stat.mtimeMs + lockLeaseMs > Date.now()) return false;
    try {
      await fs.rmdir(lockDirectory);
      return true;
    } catch (error) {
      if (['ENOENT', 'ENOTEMPTY'].includes(error.code)) return false;
      throw error;
    }
  }
  if (entries.length !== 1 || entries[0] !== 'owner.json') return false;
  const ownerFile = path.join(lockDirectory, 'owner.json');
  let ownerStat;
  try {
    ownerStat = await fs.lstat(ownerFile);
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    throw error;
  }
  if (!ownerStat.isFile() || ownerStat.isSymbolicLink()) return false;
  let owner;
  try {
    owner = JSON.parse(await fs.readFile(ownerFile, 'utf8'));
  } catch (error) {
    if (error.code === 'ENOENT') return true;
    if (ownerStat.mtimeMs + lockLeaseMs > Date.now()) return false;
    owner = null;
  }
  const expiredByAge = ownerStat.mtimeMs + lockLeaseMs <= Date.now();
  const expiredByOwner = Number.isFinite(owner?.expiresAt) && owner.expiresAt <= Date.now();
  if (!expiredByAge && !expiredByOwner) return false;
  try {
    await fs.unlink(ownerFile);
    await fs.rmdir(lockDirectory);
    return true;
  } catch (error) {
    if (['ENOENT', 'ENOTEMPTY'].includes(error.code)) return false;
    throw error;
  }
}

async function lock(directory) {
  const lockDirectory = path.join(directory, 'lock');
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await fs.mkdir(lockDirectory);
      const owner = path.join(lockDirectory, 'owner.json');
      const token = randomUUID();
      try {
        await fs.writeFile(owner, JSON.stringify({
          schema: 1,
          pid: process.pid,
          token,
          expiresAt: Date.now() + lockLeaseMs,
        }), { flag: 'wx', mode: 0o600 });
      } catch (error) {
        await fs.rmdir(lockDirectory).catch(() => {});
        throw error;
      }
      return async () => {
        const current = await readJson(owner, null).catch(() => null);
        if (current?.token !== token) return;
        await fs.unlink(owner).catch(() => {});
        await fs.rmdir(lockDirectory).catch(() => {});
      };
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      if (await recoverExpiredLock(lockDirectory)) continue;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
  }
  return null;
}

const emit = (value) => new Promise((resolve, reject) => {
  process.stdout.write(JSON.stringify(value) + '\n', (error) => error ? reject(error) : resolve());
});

function refreshOutput(vendor, name, current) {
  const context = `REPO_KNOWLEDGE_REFRESH: Load applicable repository knowledge for this session or resumed context. Read .agents/skills/refresh-repo-knowledge/SKILL.md completely and follow its workflow in this checkout before finalizing. Hook event: ${name}. Snapshot: ${current.revision}. This notice is not approval, a task from another agent, or proof of a source read.`;
  return vendor === 'copilot'
    ? { additionalContext: context, hookSpecificOutput: { hookEventName: name, additionalContext: context } }
    : { hookSpecificOutput: { hookEventName: name, additionalContext: context } };
}

async function run(event, vendor) {
  if (!supportedEvents.has(event.hook_event_name)) return;
  if (!['claude', 'codex', 'copilot'].includes(vendor)) throw new Error('Expected a supported client adapter.');
  if (vendor === 'copilot' && event.hook_event_name === 'PostToolUse') {
    const tool = typeof event.tool_name === 'string' ? event.tool_name : '';
    if (!/(^|[_-])(write|edit|create|replace|patch)([_-]|$)/i.test(tool)) return;
  }
  if (typeof event.session_id !== 'string' || !event.session_id || event.session_id.length > 256) {
    throw new Error('Missing or invalid host session identity.');
  }
  if (typeof event.cwd !== 'string' || !within(root, await fs.realpath(event.cwd))) {
    throw new Error('Session cwd is outside this checkout.');
  }

  const sessionKey = hash(JSON.stringify([vendor, root, event.session_id, event.agent_id ?? null]));
  const directory = await localDirectory(['.agent-runtime', 'knowledge-hooks']);
  const stateFile = path.join(directory, 'state.json');
  const name = event.hook_event_name;
  const release = await lock(directory);
  if (!release) {
    const current = await snapshot();
    const output = refreshOutput(vendor, name, current);
    const latest = await readJson(stateFile, null).catch(() => null);
    const alreadyOffered = latest?.schema === 2
      && latest.sessions?.[sessionKey]?.offeredRevision === current.revision;
    if (name !== 'SessionStart' && alreadyOffered) return;
    await emit(output);
    return;
  }
  try {
    const state = await readJson(stateFile, { schema: 2, sessions: {} });
    if (state.schema !== 2 || !state.sessions || typeof state.sessions !== 'object' || Array.isArray(state.sessions)) {
      throw new Error('Unsupported hook state schema.');
    }
    const current = await snapshot();
    const output = refreshOutput(vendor, name, current);
    const previous = state.sessions[sessionKey] ?? null;
    const offered = name === 'SessionStart' || previous?.offeredRevision !== current.revision;
    const reason = name === 'SessionStart' ? 'context-refresh' : offered ? 'knowledge-changed' : 'unchanged';
    // Commit only after stdout accepts the notice: failed bookkeeping may duplicate, never suppress, a refresh.
    if (offered) await emit(output);
    const lastSeenAt = new Date().toISOString();
    const sessions = [
      [sessionKey, {
        vendor,
        offeredRevision: offered ? current.revision : previous?.offeredRevision ?? null,
        lastSeenAt,
        recent: [...(previous?.recent ?? []), {
          at: lastSeenAt,
          event: name,
          reason,
          offered,
          revision: current.revision,
          files: current.files,
        }].slice(-24),
      }],
      ...Object.entries(state.sessions).filter(([key]) => key !== sessionKey),
    ];
    const boundedSessions = Object.fromEntries(sessions
      .sort((left, right) => right[1].lastSeenAt.localeCompare(left[1].lastSeenAt))
      .slice(0, stateCapacity));
    await atomicJson(stateFile, {
      schema: 2,
      sessions: boundedSessions,
    });
  } finally {
    await release();
  }
}

export async function main(vendor) {
  try {
    if (process.argv.includes('--doctor')) {
      const current = await snapshot();
      console.log(JSON.stringify({
        node: process.versions.node,
        root,
        ...current,
        hookState: '.agent-runtime/knowledge-hooks',
        hostTrust: 'not checked',
        modelDelivery: 'not checked',
      }, null, 2));
      return;
    }
    const chunks = [];
    let size = 0;
    for await (const chunk of process.stdin) {
      size += chunk.length;
      if (size > 1024 * 1024) throw new Error('Hook event exceeds the 1 MiB input limit.');
      chunks.push(chunk);
    }
    await run(JSON.parse(Buffer.concat(chunks).toString('utf8')), vendor);
  } catch (error) {
    const message = `Repository knowledge hook could not check freshness. Use refresh-repo-knowledge explicitly. ${error.message}`;
    await emit(vendor === 'copilot' ? { systemMessage: message, additionalContext: message } : { systemMessage: message }).catch(() => {});
  }
}
