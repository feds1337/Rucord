// Offline release smoke; never invokes semantic-release publishing or Apple services.
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { load } from 'js-yaml';
import { analyzeCommits } from '@semantic-release/commit-analyzer';
import { generateNotes } from '@semantic-release/release-notes-generator';
import getLastRelease from './node_modules/semantic-release/lib/get-last-release.js';
import { generateReleaseNotes } from './notes.mjs';

const logger = { log() {} };
for (const [message, expected] of [
  ['fix(ui): fix scrolling', 'patch'], ['feat(ui): add search', 'minor'],
  ['feat!: change storage format', 'major'], ['docs: update guide', null],
]) {
  assert.equal(await analyzeCommits({ preset: 'conventionalcommits' }, {
    cwd: process.cwd(), logger, commits: [{ message, hash: 'abcdef1' }],
  }), expected);
}
assert.equal(getLastRelease({
  branch: { type: 'release', tags: [
    { version: '1.1.0-nightly.20260913.9', gitTag: 'v1.1.0-nightly.20260913.9', channels: [null] },
    { version: '1.0.0', gitTag: 'v1.0.0', channels: [null] },
  ] }, options: { tagFormat: 'v${version}' },
}).version, '1.0.0');
const notes = await generateNotes({ preset: 'conventionalcommits' }, {
  cwd: process.cwd(), logger, options: { repositoryUrl: 'https://github.com/example/rucord' },
  commits: [{ message: 'fix(ui): fix scrolling', hash: 'abcdef1' }],
  lastRelease: { gitTag: 'v1.0.0' }, nextRelease: { version: '1.0.1', gitTag: 'v1.0.1' },
});
assert(notes.includes('fix scrolling'));

const releaseNotesContext = {
  cwd: process.cwd(), logger, options: { repositoryUrl: 'https://github.com/feds1337/Rucord' },
  commits: [
    { hash: 'eb98a663421d6e142fe0f5f3be6f175a1b95a8e9', author: { name: 'Release Note Author', email: 'release-note-author@example.invalid' }, message: 'feat(ui): add category and channel permission settings (#149)' },
    { hash: 'baec1dfc7b5755b0f063a1ea16d05f81936d0dc0', author: { name: 'Audio Note Author', email: 'audio-note-author@example.invalid' }, message: 'feat(audio): bundle notification sounds (#140)' },
  ],
  lastRelease: { gitTag: 'v1.0.0' },
  nextRelease: { version: '1.0.0', gitHead: 'v1.0.0-nightly.10.1' },
};
const prodNotes = await generateReleaseNotes('production', { preset: 'conventionalcommits' }, releaseNotesContext);
assert(prodNotes.includes('category and channel permission settings'));
assert(prodNotes.includes('notification sounds'));
assert(prodNotes.includes('by Release Note Author'));
assert(prodNotes.includes('[#149](https://github.com/feds1337/Rucord/pull/149)'));
assert(prodNotes.includes('## New Contributors'));
assert(prodNotes.indexOf('## New Contributors') > prodNotes.indexOf('notification sounds'));
assert(prodNotes.includes('Release Note Author made their first contribution'));

const originalCwd = process.cwd();
const historyFixture = mkdtempSync(join(tmpdir(), 'rucord-release-history-'));
let audioHash;
let categoryHash;
try {
  const git = args => execFileSync('git', args, { cwd: historyFixture, encoding: 'utf8' }).trim();
  git(['init', '--quiet', '--initial-branch=main']);
  git(['config', 'user.name', 'Fixture Author']);
  git(['config', 'user.email', 'fixture@example.invalid']);
  writeFileSync(join(historyFixture, 'history.txt'), 'initial\n');
  git(['add', 'history.txt']);
  git(['commit', '--quiet', '-m', 'chore: release notes fixture']);
  writeFileSync(join(historyFixture, 'history.txt'), 'audio\n');
  git(['add', 'history.txt']);
  execFileSync('git', ['-c', 'user.name=Audio Note Author', '-c', 'user.email=audio-note-author@example.invalid', 'commit', '--quiet', '-m', 'feat(audio): bundle notification sounds (#140)'], { cwd: historyFixture });
  audioHash = git(['rev-parse', 'HEAD']);
  git(['tag', 'v1.0.0']);
  writeFileSync(join(historyFixture, 'history.txt'), 'categories\n');
  git(['add', 'history.txt']);
  execFileSync('git', ['-c', 'user.name=Release Note Author', '-c', 'user.email=release-note-author@example.invalid', 'commit', '--quiet', '-m', 'feat(ui): add category and channel permission settings (#149)'], { cwd: historyFixture });
  categoryHash = git(['rev-parse', 'HEAD']);
  const nightlyContext = {
    ...releaseNotesContext,
    commits: [releaseNotesContext.commits[1], releaseNotesContext.commits[0]].map(commit => ({
      ...commit,
      hash: commit.author.name === 'Audio Note Author' ? audioHash : categoryHash,
    })),
    nextRelease: { version: '1.1.0-nightly.20261125.2', gitHead: categoryHash },
  };
  process.chdir(historyFixture);
  const nightlyNotes = await generateReleaseNotes('nightly', { preset: 'conventionalcommits' }, nightlyContext);
  assert(nightlyNotes.includes('category and channel permission settings'));
  assert(!nightlyNotes.includes('notification sounds'));
} finally {
  process.chdir(originalCwd);
  rmSync(historyFixture, { recursive: true, force: true });
}

const workflow = load(readFileSync('.github/workflows/release.yml', 'utf8'));
assert.deepEqual(Object.keys(workflow.on), ['workflow_dispatch']);
assert.equal(workflow.env.CARGO_PROFILE_TEST_DEBUG, 0);
assert.equal(workflow.env.CARGO_INCREMENTAL, 0);
const ciWorkflow = load(readFileSync('.github/workflows/ci.yml', 'utf8'));
assert.equal(ciWorkflow.env.CARGO_PROFILE_TEST_DEBUG, 0);
assert.equal(ciWorkflow.env.CARGO_INCREMENTAL, 0);
const linuxWorkflow = load(readFileSync('.github/workflows/linux-packages.yml', 'utf8'));
const linuxPackageStep = linuxWorkflow.jobs.native.steps.find(step => step.name === 'Build and inspect native package');
assert.equal(linuxPackageStep.env.CARGO_PROFILE_RELEASE_LTO, "${{ matrix.runner == 'ubuntu-24.04-arm' && 'thin' || 'fat' }}");
assert.equal(linuxPackageStep.env.CARGO_PROFILE_RELEASE_CODEGEN_UNITS, "${{ matrix.runner == 'ubuntu-24.04-arm' && '4' || '1' }}");
assert(linuxPackageStep.run.includes('CARGO_PROFILE_RELEASE_LTO="$CARGO_PROFILE_RELEASE_LTO"'));
assert(linuxPackageStep.run.includes('CARGO_PROFILE_RELEASE_CODEGEN_UNITS="$CARGO_PROFILE_RELEASE_CODEGEN_UNITS"'));
assert.deepEqual(workflow.jobs.build.strategy.matrix.os, ['windows-latest', 'windows-11-arm']);
assert.equal(workflow.jobs.repositories, undefined, 'release must not deploy an unsigned package repository');
assert(workflow.jobs.build.steps.some(step => step.name === 'Test installer with offline fixture'));
assert(workflow.jobs.build.steps.some(step => step.run?.includes('Expected one NSIS installer')));
assert(workflow.jobs.publish.steps.some(step => step.run === 'gh auth setup-git'));
assert(!readFileSync('.github/release/release.mjs', 'utf8').includes('HOMEBREW_TAP_TOKEN is required'));
assert(!readFileSync('.github/workflows/linux-packages.yml', 'utf8').includes('cp target/flatpak-build/rucord.flatpakref "release-assets/'));
if (process.platform !== 'win32') {
  execFileSync('bash', ['-n'], { input: linuxPackageStep.run });
  for (const job of Object.values(workflow.jobs)) {
    for (const step of job.steps ?? []) {
      if (step.run && step.shell !== 'pwsh') execFileSync('bash', ['-n'], { input: step.run });
    }
  }
  execFileSync('bash', ['-n', 'packaging/macos/sign-release.sh']);
  execFileSync('bash', ['packaging/macos/test_sign_release.sh'], { stdio: 'inherit' });
}
execFileSync(process.env.PYTHON || 'python3', ['-c', `
import glob, os, pathlib, shutil, subprocess, tempfile, tomllib
root = pathlib.Path.cwd()
manifest = tomllib.loads((root / 'Cargo.toml').read_text())
with tempfile.TemporaryDirectory() as directory:
    fixture = pathlib.Path(directory)
    paths = ['Cargo.toml', 'Cargo.lock', 'fuzz/Cargo.lock', 'packaging/macos/Info.plist']
    for member in manifest['workspace']['members']:
        paths.extend(glob.glob(member + '/Cargo.toml'))
    for path in paths:
        (fixture / path).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(root / path, fixture / path)
    os.chdir(fixture)
    for version in ['1.2.3-nightly.20260913.9', '1.2.3']:
        subprocess.run([os.sys.executable, str(root / '.github/release/version.py'), version], check=True)
        assert tomllib.loads(pathlib.Path('Cargo.toml').read_text())['workspace']['package']['version'] == version
        for lock in ['Cargo.lock', 'fuzz/Cargo.lock']:
            packages = tomllib.loads(pathlib.Path(lock).read_text())['package']
            original = tomllib.loads((root / lock).read_text())['package']
            assert [p for p in packages if 'source' in p] == [p for p in original if 'source' in p]
            assert next(p['version'] for p in packages if p['name'] == 'model' and 'source' not in p) == version
    import plistlib
    assert plistlib.loads(pathlib.Path('packaging/macos/Info.plist').read_bytes())['CFBundleShortVersionString'] == '1.2.3'
    os.chdir(root)
`], { stdio: 'inherit' });
console.log('Release smoke passed: semantic bumps/notes, nightly isolation, manifest/lock versions, YAML and shell syntax.');
