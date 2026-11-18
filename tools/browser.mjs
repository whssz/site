import { createRequire } from 'node:module';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

export async function launchBrowser(chromium) {
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (process.env.CHROMIUM_PATH) return chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args });
  if (process.platform !== 'linux') return chromium.launch({ args });

  // The npm distribution bundles both Chromium and the NSS libraries missing in minimal sandboxes.
  const require = createRequire(import.meta.url);
  const packageEntry = require.resolve('@sparticuz/chromium');
  const { default: packaged, inflate, setupLambdaEnvironment } = await import('@sparticuz/chromium');
  await inflate(resolve(packageEntry, '../../bin/al2023.tar.br'));
  setupLambdaEnvironment(join(tmpdir(), 'al2023', 'lib'));
  return chromium.launch({ executablePath: await packaged.executablePath(), args });
}
