#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = await fs.realpath(fileURLToPath(new URL('../../../../', import.meta.url)));
const docs = path.join(root, 'docs');
const indexFile = path.join(docs, 'INDEX.md');
const rootRecordDirectories = ['adr', 'pdr', 'prd'];
const maxFiles = 1000;
const maxBytes = 8 * 1024 * 1024;

const toPosix = (value) => value.split(path.sep).join('/');

async function requirePlainDirectory(directory, { create = false } = {}) {
  if (create) await fs.mkdir(directory, { recursive: true });
  const stat = await fs.lstat(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Expected a local directory: ${toPosix(path.relative(root, directory))}`);
  }
}

function documentTitle(source, relative) {
  const lines = source.replace(/^\uFEFF/, '').replaceAll('\r\n', '\n').split('\n');
  let start = 0;
  if (lines[0] === '---') {
    const end = lines.findIndex((line, index) => index > 0 && (line === '---' || line === '...'));
    if (end < 0) throw new Error(`Unclosed frontmatter: ${relative}`);
    start = end + 1;
  }

  let fence = null;
  let comment = false;
  for (const line of lines.slice(start)) {
    if (comment) {
      if (line.includes('-->')) comment = false;
      continue;
    }
    const delimiter = line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (fence) {
      if (delimiter && delimiter[1][0] === fence[0] && delimiter[1].length >= fence.length && !delimiter[2].trim()) fence = null;
      continue;
    }
    if (/^ {0,3}<!--/.test(line)) {
      comment = !line.includes('-->');
      continue;
    }
    if (delimiter) {
      fence = delimiter[1];
      continue;
    }
    const heading = line.match(/^ {0,3}#\s+(.+?)\s*$/);
    if (heading) return heading[1].replace(/\s+#+$/, '').trim();
  }
  if (comment) throw new Error(`Unclosed HTML comment: ${relative}`);
  throw new Error(`Missing level-one heading: ${relative}`);
}

async function readStable(file) {
  const before = await fs.lstat(file);
  if (!before.isFile() || before.isSymbolicLink()) throw new Error(`Expected a local file: ${file}`);
  const content = await fs.readFile(file, 'utf8');
  const after = await fs.stat(file);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
    throw new Error('Knowledge changed while reading; retry.');
  }
  return { content, size: before.size };
}

async function componentRecordDirectories() {
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
    result.push(adr);
  }
  return result;
}

async function entries() {
  await requirePlainDirectory(docs);
  const result = [];
  let bytes = 0;

  async function visit(directory) {
    let names;
    try {
      names = (await fs.readdir(directory)).sort();
    } catch (error) {
      if (error.code === 'ENOENT') return;
      throw error;
    }
    for (const name of names) {
      const file = path.join(directory, name);
      const stat = await fs.lstat(file);
      if (stat.isSymbolicLink()) throw new Error(`Linked knowledge path is not allowed: ${toPosix(path.relative(docs, file))}`);
      if (stat.isDirectory()) await visit(file);
      else if (stat.isFile() && path.extname(name).toLowerCase() === '.md') {
        const relative = toPosix(path.relative(root, file));
        const stable = await readStable(file);
        bytes += stable.size;
        if (result.length >= maxFiles || bytes > maxBytes) throw new Error('Knowledge exceeds the 1000 file / 8 MiB limit.');
        result.push({
          file: relative,
          href: toPosix(path.relative(docs, file)),
          title: documentTitle(stable.content, relative),
        });
      }
    }
  }

  for (const directory of rootRecordDirectories) await visit(path.join(docs, directory));
  for (const directory of await componentRecordDirectories()) await visit(directory);
  return result.sort((left, right) => left.file.localeCompare(right.file, 'en'));
}

function escapeLabel(value) {
  return value
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replace(/[\\[\]*_`|]/g, '\\$&');
}

function href(relative) {
  return relative.split('/').map((part) => encodeURIComponent(part).replace(/[!'()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`)).join('/');
}

function render(records) {
  const header = `# A projekttudás indexe\n\n<!-- Generated by record-decision/scripts/update-index.mjs. Edit source documents, then run --write. -->\n\nAz indexet a tudástárat módosító agent generálja a források címe és útvonala alapján.\nA státuszt, verziót, jóváhagyást és alkalmazhatóságot mindig a teljes dokumentumban ellenőrizd.\nÜres találatnál a \`docs/adr/\`, \`docs/pdr/\`, \`docs/prd/\` és a \`src/*/docs/adr/\` fájljaiban keress.\n\n[Használat](README.md) · [Karbantartási szabályok](governance.md)\n\n`;
  if (!records.length) return header + 'Még nincs saját projektdokumentum. A [sablonok](templates/) nem aktív követelmények.\n';
  const rows = records.map((record) => `| [${escapeLabel(record.title)}](${href(record.href)}) | ${escapeLabel(path.posix.dirname(record.file))} |`).join('\n');
  return header + '| Dokumentum | Helye a tudástárban |\n| --- | --- |\n' + rows + '\n';
}

async function readCurrent() {
  try {
    const stat = await fs.lstat(indexFile);
    if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('docs/INDEX.md must be a local file.');
    return await fs.readFile(indexFile, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

async function main() {
  const mode = process.argv[2] ?? '--check';
  if (!['--check', '--write'].includes(mode) || process.argv.length > 3) {
    throw new Error('Usage: node .agents/skills/record-decision/scripts/update-index.mjs [--check|--write]');
  }
  if (mode === '--check') {
    const records = await entries();
    const current = await readCurrent();
    if (JSON.stringify(records) !== JSON.stringify(await entries())) {
      throw new Error('Knowledge changed during index verification; retry.');
    }
    const expected = render(records);
    if (current !== expected) throw new Error('docs/INDEX.md is stale. The knowledge-writing agent must run update-index.mjs --write.');
    console.log('docs/INDEX.md is current.');
    return;
  }
  const runtime = path.join(root, '.agent-runtime');
  await requirePlainDirectory(runtime, { create: true });
  const lock = path.join(runtime, 'knowledge-index.lock');
  let handle;
  try {
    handle = await fs.open(lock, 'wx', 0o600);
  } catch (error) {
    if (error.code === 'EEXIST') throw new Error('Another writer owns the knowledge index lock.');
    throw error;
  }
  const temporary = `${indexFile}.${randomUUID()}.tmp`;
  try {
    await handle.writeFile(String(process.pid));
    const records = await entries();
    const current = await readCurrent();
    const expected = render(records);
    if (current === expected) {
      console.log('docs/INDEX.md is unchanged.');
      return;
    }
    await fs.writeFile(temporary, expected, { encoding: 'utf8', flag: 'wx', mode: 0o600 });
    if (JSON.stringify(records) !== JSON.stringify(await entries())) {
      throw new Error('Knowledge changed during index generation; retry.');
    }
    if (await readCurrent() !== current) {
      throw new Error('docs/INDEX.md changed during generation; coordinate writers and retry.');
    }
    await fs.rename(temporary, indexFile);
    console.log('docs/INDEX.md updated.');
  } finally {
    await fs.unlink(temporary).catch(() => {});
    await handle.close();
    await fs.unlink(lock).catch(() => {});
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
