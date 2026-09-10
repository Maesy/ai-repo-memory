// Research fixture, not the shipped search implementation. Run with Node supporting FTS5.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'repo-fts5-probe-'));
const hash = (value) => createHash('sha256').update(value).digest('hex');
const elapsed = (fn) => { const start = performance.now(); const value = fn(); return { ms: +(performance.now() - start).toFixed(3), value }; };
const literalQuery = (input, prefix = false) => [...input.matchAll(/[\p{L}\p{N}]+/gu)].map(([word]) => '"' + word + '"' + (prefix ? '*' : '')).join(' AND ');
const checks = {};
const connections = [];
const open = (file) => {
  const db = new DatabaseSync(file); connections.push(db);
  db.exec("PRAGMA journal_mode=DELETE; PRAGMA busy_timeout=25; CREATE VIRTUAL TABLE IF NOT EXISTS documents USING fts5(title,body,path UNINDEXED,hash UNINDEXED,tokenize='unicode61 remove_diacritics 2')");
  return db;
};
function sync(db, directory, injectFailure = false) {
  const files = fs.readdirSync(directory).filter((file) => file.endsWith('.md')).sort();
  const prior = new Map(db.prepare('SELECT rowid,path,hash FROM documents').all().map((row) => [row.path, row]));
  const changes = [];
  let added = 0, updated = 0;
  for (const file of files) {
    const body = fs.readFileSync(path.join(directory, file), 'utf8'), digest = hash(body), previous = prior.get(file);
    prior.delete(file);
    if (previous?.hash === digest) continue;
    changes.push({ file, body, digest, title: body.match(/^# (.+)$/m)?.[1] ?? file, rowid: previous?.rowid });
    if (previous) updated++; else added++;
  }
  const result = { added, updated, deleted: prior.size, hashed: files.length };
  if (!changes.length && !prior.size) return result;
  db.exec('BEGIN IMMEDIATE');
  try {
    const insert = db.prepare('INSERT INTO documents(title,body,path,hash) VALUES(?,?,?,?)');
    const update = db.prepare('UPDATE documents SET title=?,body=?,hash=? WHERE rowid=?');
    const remove = db.prepare('DELETE FROM documents WHERE rowid=?');
    for (const row of prior.values()) remove.run(row.rowid);
    for (const row of changes) {
      if (row.rowid !== undefined) update.run(row.title, row.body, row.digest, row.rowid);
      else insert.run(row.title, row.body, row.file, row.digest);
    }
    if (injectFailure) throw new Error('Injected interruption before commit');
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return result;
}
const search = (db, text, prefix = false) => {
  const query = literalQuery(text, prefix);
  if (!query) return [];
  return db.prepare("SELECT path,title,bm25(documents,5,1,0,0) AS score,snippet(documents,1,'[',']',' … ',18) AS excerpt FROM documents WHERE documents MATCH ? ORDER BY score,path LIMIT 5").all(query);
};
function median(samples) { return [...samples].sort((a, b) => a - b)[Math.floor(samples.length / 2)]; }

try {
  const directory = path.join(root, 'behavior'); fs.mkdirSync(directory);
  const file = path.join(root, 'behavior.sqlite'), db = open(file);
  const write = (name, body) => fs.writeFileSync(path.join(directory, name), body);
  write('hu.md', '# Hitelesítés\nLezárt feladatok újranyitása. Jogosultságok ellenőrzése.');
  write('code.md', '# Lifecycle\nUserPromptSubmit invokes a knowledge refresh.');
  write('title.md', '# Cache invalidation\nThe current snapshot is compared.');
  write('body.md', '# Implementation guide\nThe document describes cache invalidation.');
  const built = sync(db, directory);
  checks.initialIndex = built.added === 4;
  const before = hash(fs.readFileSync(file)), noChange = sync(db, directory);
  checks.idempotent = noChange.added === 0 && noChange.updated === 0 && noChange.deleted === 0 && before === hash(fs.readFileSync(file));
  checks.accentInsensitive = search(db, 'hitelesites')[0]?.path === 'hu.md';
  checks.hungarianExactDoesNotStem = search(db, 'feladat').length === 0;
  checks.hungarianPrefixFindsSuffix = search(db, 'feladat', true)[0]?.path === 'hu.md';
  checks.noAutomaticTranslation = search(db, 'reopen').length === 0;
  checks.noCamelCaseSplitting = search(db, 'Prompt').length === 0 && search(db, 'UserPromptSubmit')[0]?.path === 'code.md';
  checks.titleWeighting = search(db, 'cache invalidation')[0]?.path === 'title.md';
  checks.snippet = search(db, 'cache invalidation')[0]?.excerpt.includes('[Cache]');
  checks.literalInput = search(db, '" OR * ; DROP TABLE documents; --').length === 0 && db.prepare('SELECT count(*) AS n FROM documents').get().n === 4;
  write('hu.md', '# Új hitelesítés\nJavított szabályok.');
  checks.unsyncedCacheIsStale = search(db, 'feladat', true).length === 1;
  const changed = sync(db, directory);
  checks.updatedSource = changed.updated === 1 && search(db, 'feladat', true).length === 0 && search(db, 'Javított')[0]?.path === 'hu.md';
  fs.renameSync(path.join(directory, 'hu.md'), path.join(directory, 'renamed.md'));
  const renamed = sync(db, directory);
  checks.renamedSource = renamed.added === 1 && renamed.deleted === 1 && search(db, 'hitelesites')[0]?.path === 'renamed.md';
  fs.unlinkSync(path.join(directory, 'renamed.md')); sync(db, directory);
  checks.deletedSource = search(db, 'hitelesites').length === 0;
  write('branch.md', '# Branch\nDraft requirement'); sync(db, directory);
  const stat = fs.statSync(path.join(directory, 'branch.md'));
  write('branch.md', '# Branch\nFinal requirement'); fs.utimesSync(path.join(directory, 'branch.md'), stat.atime, stat.mtime);
  checks.sameSizeMtimeChange = sync(db, directory).updated === 1 && search(db, 'Final')[0]?.path === 'branch.md';
  write('branch.md', '# Branch\nInterrupted requirement');
  let failed = false; try { sync(db, directory, true); } catch { failed = true; }
  checks.rollback = failed && search(db, 'Final')[0]?.path === 'branch.md' && search(db, 'Interrupted').length === 0;
  sync(db, directory);
  const second = open(file);
  db.exec('BEGIN IMMEDIATE');
  db.prepare('UPDATE documents SET body=? WHERE path=?').run('Uncommitted revision', 'branch.md');
  checks.readerSeesCommittedSnapshot = search(second, 'Interrupted')[0]?.path === 'branch.md' && search(second, 'Uncommitted').length === 0;
  let busy = false; try { second.exec('BEGIN IMMEDIATE'); } catch { busy = true; }
  checks.secondWriterIsBounded = busy;
  db.exec('ROLLBACK');
  second.exec('BEGIN IMMEDIATE; COMMIT'); checks.writerCanRetry = true;
  db.exec("CREATE VIRTUAL TABLE substrings USING fts5(body,tokenize='trigram'); INSERT INTO substrings(body) VALUES('UserPromptSubmit UI');");
  checks.trigramFindsSubstring = db.prepare('SELECT count(*) AS n FROM substrings WHERE substrings MATCH ?').get('Prompt').n === 1;
  checks.trigramMissesShortTerm = db.prepare('SELECT count(*) AS n FROM substrings WHERE substrings MATCH ?').get('UI').n === 0;

  const benchmarks = [];
  for (const count of [100, 1000]) {
    const corpus = path.join(root, 'corpus-' + count); fs.mkdirSync(corpus);
    const corpusFile = path.join(root, 'corpus-' + count + '.sqlite'), store = open(corpusFile);
    let sourceBytes = 0;
    for (let i = 0; i < count; i++) {
      const topic = ['reopen', 'authentication', 'billing', 'hooks', 'indexing'][i % 5];
      const content = '# ' + topic + ' decision ' + i + '\n\n' + ('This document records the project requirement, alternatives, rationale and testing expectations. ' + topic + ' must preserve the agreed behavior.\n').repeat(8);
      sourceBytes += Buffer.byteLength(content); fs.writeFileSync(path.join(corpus, String(i).padStart(4, '0') + '.md'), content);
    }
    const build = elapsed(() => sync(store, corpus));
    const queries = Array.from({ length: 30 }, () => elapsed(() => search(store, 'reopen')).ms);
    const fresh = Array.from({ length: 5 }, () => elapsed(() => { sync(store, corpus); return search(store, 'reopen'); }).ms);
    const rg = Array.from({ length: 5 }, () => elapsed(() => {
      const result = spawnSync('rg', ['-l', '-i', 'reopen', corpus], { encoding: 'utf8', windowsHide: true });
      if (result.status !== 0) throw new Error('rg baseline failed: ' + result.stderr);
      return result.stdout.trim().split(/\r?\n/).length;
    }));
    benchmarks.push({ documents: count, sourceBytes, databaseBytes: fs.statSync(corpusFile).size, buildMs: build.ms,
      warmFtsTop5MedianMs: median(queries), hashAllThenFtsTop5MedianMs: median(fresh), rgFileListMedianMs: median(rg.map(r => r.ms)), rgMatchingFiles: rg[0].value });
  }
  const report = { at: new Date().toISOString(), platform: process.platform, node: process.version,
    sqlite: db.prepare('SELECT sqlite_version() AS version').get().version,
    fts5: db.prepare("SELECT sqlite_compileoption_used('ENABLE_FTS5') AS enabled").get().enabled === 1,
    journalMode: db.prepare('PRAGMA journal_mode').get().journal_mode,
    checks, benchmarks,
    limits: ['Synthetic English benchmark documents; not a production relevance evaluation.', 'Warm filesystem/cache measurements on this Windows host only.', 'FTS top-5 ranking and rg all matching file names are different outputs.', 'Warm FTS timings exclude process startup and source freshness work; hash-all measurements include file reads.', 'The fixture reconciler is research code, not a shipped or crash-safe multi-agent search service.', 'Lock behavior measured using two connections in one process, not separate native agent sessions.', 'Prefix is an explicit search mode; no Hungarian morphological analysis or automatic synonyms.'] };
  fs.writeFileSync(new URL('./fts5-probe-results.json', import.meta.url), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
  if (Object.values(checks).some((passed) => !passed)) process.exitCode = 1;
} finally {
  for (const db of connections) db.close();
  if (!path.resolve(root).startsWith(path.join(os.tmpdir(), 'repo-fts5-probe-'))) throw new Error('Unexpected cleanup path');
  fs.rmSync(root, { recursive: true, force: true });
}
