import { spawnSync } from 'node:child_process';

const isWindows = process.platform === 'win32';
const npmCommand = isWindows ? 'npm.cmd' : 'npm';
const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    encoding: 'utf8',
    cwd: options.cwd || process.cwd(),
  });

  if (result.status !== 0) {
    const error = new Error(
      `Command failed: ${command} ${commandArgs.join(' ')}` +
      (options.capture && result.stderr ? `\n${result.stderr.trim()}` : ''),
    );
    error.status = result.status;
    throw error;
  }

  return options.capture ? result.stdout.trim() : '';
}

function read(commandArgs) {
  return run('git', commandArgs, { capture: true });
}

function fail(message) {
  console.error(`\n[deploy:prod] ${message}\n`);
  process.exit(1);
}

try {
  run('git', ['fetch', 'origin']);

  const branch = read(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch !== 'main') {
    fail(`Refusing to deploy from branch "${branch}". Switch to "main" first.`);
  }

  const status = read(['status', '--porcelain']);
  if (status) {
    fail('Working tree is not clean. Commit, stash, or remove local changes before deploying.');
  }

  const localHead = read(['rev-parse', 'HEAD']);
  const remoteHead = read(['rev-parse', 'origin/main']);
  if (localHead !== remoteHead) {
    const divergence = read(['rev-list', '--left-right', '--count', 'HEAD...origin/main']);
    fail(`Local main is not identical to origin/main (divergence ${divergence}). Pull/push until they match.`);
  }

  console.log('[deploy:prod] Git state is clean and synced with origin/main.');

  run(npmCommand, ['run', 'build']);
  console.log('[deploy:prod] Production build passed.');

  if (dryRun) {
    console.log('[deploy:prod] Dry run complete. Skipping Vercel deploy.');
    process.exit(0);
  }

  run(npmCommand, ['exec', '--', 'vercel', 'deploy', '--prod', '--yes']);
} catch (error) {
  fail(error instanceof Error ? error.message : 'Unknown deploy failure.');
}
