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
  const { default: packaged, inflate, setupLambdaEnvironment } = await import('@sparticuz/chromium');
  const libBundle = fileURLToPath(new URL('../bin/al2023.tar.br', import.meta.resolve('@sparticuz/chromium')));
  if (existsSync(libBundle)) setupLambdaEnvironment(join(await inflate(libBundle), 'lib'));
  return chromium.launch({ executablePath: await packaged.executablePath(), args: [...args, '--disable-gpu'] });
}
