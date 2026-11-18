import { chromium } from 'playwright';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname, delimiter } from 'node:path';
import { tmpdir } from 'node:os';
import { brotliDecompressSync } from 'node:zlib';
import { spawnSync } from 'node:child_process';

export async function launchBrowser() {
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  const executable = process.env.CHROMIUM_PATH ?? chromium.executablePath();
  if (process.env.CHROMIUM_PATH || existsSync(executable)) return chromium.launch({ args, executablePath: executable });
  const { default: packaged } = await import('@sparticuz/chromium');
  const bin = dirname(createRequire(import.meta.url).resolve('@sparticuz/chromium/package.json'));
  const scratch = mkdtempSync(join(tmpdir(), 'dai-chromium-'));
  const archive = brotliDecompressSync(readFileSync(join(bin, 'bin', 'al2023.tar.br')));
  const tar = spawnSync('tar', ['-xf', '-', '-C', scratch], { input: archive });
  if (tar.status !== 0) throw new Error(`Bibliotecas do Chromium: ${tar.stderr}`);
  const env = { ...process.env, LD_LIBRARY_PATH: [join(scratch, 'lib'), process.env.LD_LIBRARY_PATH].filter(Boolean).join(delimiter) };
  try {
    const browser = await chromium.launch({
      args: [...args, '--no-zygote'], executablePath: await packaged.executablePath(), env
    });
    browser.on('disconnected', () => rmSync(scratch, { recursive: true, force: true }));
    return browser;
  } catch (error) {
    rmSync(scratch, { recursive: true, force: true });
    throw error;
  }
}
