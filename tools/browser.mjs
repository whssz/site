import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export async function launchBrowser() {
  const { chromium } = await import('playwright');
  const local = process.env.CHROMIUM_EXECUTABLE || chromium.executablePath();
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (existsSync(local)) return chromium.launch({ executablePath: local, args });
  if (process.platform !== 'linux') return chromium.launch({ args });
  // Reproducible in a minimal Linux workspace that can reach npm, but not the browser CDN.
  const c = (await import('node:module')).createRequire(import.meta.url);
  const packaged = c('@sparticuz/chromium');
  const libDir = process.env.CHROMIUM_LIBS || '/tmp/al2023/lib';
  const ld = existsSync(libDir) ? libDir + ':' + (process.env.LD_LIBRARY_PATH || '') : process.env.LD_LIBRARY_PATH;
  return chromium.launch({
    executablePath: await packaged.executablePath(),
    args: [...args, '--disable-gpu'],
    env: { ...process.env, ...(ld ? { LD_LIBRARY_PATH: ld } : {}) },
  });
}
