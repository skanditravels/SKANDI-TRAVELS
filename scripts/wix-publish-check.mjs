import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

export function needsWixPublish(cwd, checkpoint, target = 'HEAD') {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  git('rev-parse', '--verify', `${target}^{commit}`);
  if (!checkpoint) return true;
  git('rev-parse', '--verify', `${checkpoint}^{commit}`);
  execFileSync('git', ['merge-base', '--is-ancestor', checkpoint, target], { cwd, stdio: 'ignore' });
  const changed = git('diff', '--no-renames', '--name-only', '-z', checkpoint, target, '--', 'src/');
  return changed.split('\0').filter(Boolean).some(name => !/\.(md|txt)$/i.test(name));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = needsWixPublish(process.cwd(), process.argv[2] || '', process.argv[3] || 'HEAD');
    console.log(result ? 'true' : 'false');
  } catch (error) {
    console.error('Cannot determine the Wix deployment delta:', error.message);
    process.exitCode = 1;
  }
}
