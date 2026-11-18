import { mkdir, readFile, stat } from 'node:fs/promises';
import { promisify } from 'node:util';
import { brotliDecompress } from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { createRequire } from 'node:module';

// Chromium + its NSS libraries from npm let the studio QA run without sudo or
// a second browser download. Developers can also provide their local Chrome.
export async function browserOptions() {
  const basic = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (process.env.CHROME_PATH) return { executablePath: process.env.CHROME_PATH, args: basic };
  if (process.platform !== 'linux' || process.arch !== 'x64') return { args: basic };
  const { default: bundled } = await import('@sparticuz/chromium');
  bundled.setGraphicsMode = false;
  const executablePath = await bundled.executablePath();
  const cache = join(tmpdir(), 'avomaria-chromium-141');
  const libs = join(cache, 'lib');
  try { await stat(join(libs, 'libnss3.so')); }
  catch {
    const entry = createRequire(import.meta.url).resolve('@sparticuz/chromium');
    const archive = join(dirname(entry), '../../bin/al2023.tar.br');
    const bytes = await promisify(brotliDecompress)(await readFile(archive));
    await mkdir(cache, { recursive: true });
    const unpack = spawnSync('tar', ['-x', '--exclude=lib/libexpat.so.1', '-f', '-', '-C', cache], { input: bytes });
    if (unpack.status !== 0) throw new Error(String(unpack.stderr || unpack.error));
  }
  const skipped = new Set(['--single-process', '--disable-web-security', '--allow-running-insecure-content', '--disable-site-isolation-trials']);
  return {
    executablePath,
    env: { ...process.env, LD_LIBRARY_PATH: [libs, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':') },
    args: [...new Set([...bundled.args.filter(arg => !skipped.has(arg)), ...basic])],
  };
}
