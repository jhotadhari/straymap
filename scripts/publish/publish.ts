import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import pc from 'picocolors';
import semver from 'semver';
import simpleGit from 'simple-git';
import { Octokit } from '@octokit/rest';
import { parser, Release } from 'keep-a-changelog';
import type { Changelog } from 'keep-a-changelog';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..');

const CHANGELOG_PATH = path.resolve(ROOT, 'CHANGELOG.md');
const PACKAGE_JSON_PATH = path.resolve(ROOT, 'package.json');
const BUILD_GRADLE_PATH = path.resolve(ROOT, 'android', 'app', 'build.gradle');

const GITHUB_REPO_URL = 'https://github.com/jhotadhari/straymap';

const git = simpleGit(ROOT);

// Pre-release type → versionCode offset within a patch bucket (100 slots per patch)
// Alpha: 0-32, Beta: 33-65, RC: 66-98, Release: +99
const PRE_RELEASE_OFFSETS: Record<string, number> = {
	alpha: 0,
	beta: 33,
	rc: 66,
};

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function fatalError(message: string): never {
	console.error(pc.red('ERROR'), message);
	process.exit(1);
}

function getCurrentVersion(): string {
	const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
	return pkg.version as string;
}

function getVersionCode(version: string): number {
	const parsed = semver.parse(version);
	if (!parsed) {
		fatalError(`Could not parse version: ${version}`);
	}
	const { major, minor, patch } = parsed;
	// Each patch gets 100 "slots" — ensures pre-releases of X.Y.(Z+1)
	// always sort above the full release of X.Y.Z
	const base = major * 1_000_000 + minor * 10_000 + patch * 100;

	if (parsed.prerelease.length === 0) {
		// Full release: sits at the top of its patch bucket
		return base + 99;
	}

	// Pre-release: type offset + number, capped within the patch bucket
	const preType = (parsed.prerelease[0] as string) ?? '';
	const preNum = Math.min((parsed.prerelease[1] as number) ?? 0, 32);
	const typeOffset = PRE_RELEASE_OFFSETS[preType] ?? 99;

	return base + typeOffset + preNum;
}

// ---------------------------------------------------------------------------
// Argument parsing / version checks
// ---------------------------------------------------------------------------

function parseVersionArg(): string {
	const version = process.argv[2];
	if (!version) {
		fatalError(
			'No version specified. ' +
				'Run `yarn run publish <version>` ' +
				'(Just the version number. Without prepending `v`)'
		);
	}
	if (!semver.valid(version)) {
		fatalError(
			'Version should be valid SemVer. ' +
				'Run `yarn run publish <major>.<minor>.<patch>` ' +
				'(pre-release tags like alpha/beta/rc are supported, e.g. `1.0.0-alpha.1`)'
		);
	}
	return version;
}

async function validateVersionIsHigher(newVersion: string): Promise<void> {
	await git.fetch(['--tags']);
	const currentVersion = getCurrentVersion();

	if (semver.lte(newVersion, currentVersion)) {
		fatalError(
			`New version (${newVersion}) must be higher than current version (${currentVersion})`
		);
	}
}

// ---------------------------------------------------------------------------
// Pre-flight checks
// ---------------------------------------------------------------------------

async function checkCleanWorkingTree(): Promise<void> {
	const status = await git.status();
	if (!status.isClean()) {
		const dirtyFiles = status.files.map((f) => `  ${f.index} ${f.path}`).join('\n');
		fatalError('Unable to publish. Uncommitted changes.\n' + dirtyFiles);
	}
}

function checkChangelogHasUnreleased(): void {
	const content = readFileSync(CHANGELOG_PATH, 'utf-8');
	if (!/## \[?Unreleased\]?/.test(content)) {
		fatalError('CHANGELOG.md should have a `[Unreleased]` section');
	}
}

async function checkBranchIsRelease(): Promise<void> {
	const branch = (await git.branch()).current;
	if (!branch.startsWith('release')) {
		fatalError('Current branch name should start with `release`');
	}
}

function runTypeCheck(): void {
	console.log(pc.blue('Running typecheck…'));
	try {
		execSync('yarn run typecheck', { stdio: 'inherit', cwd: ROOT });
	} catch {
		fatalError('Unable to publish. TypeScript compile complains errors. Fix them first!');
	}
}

// ---------------------------------------------------------------------------
// Changelog helpers
// ---------------------------------------------------------------------------

function readChangelog(): Changelog {
	const content = readFileSync(CHANGELOG_PATH, 'utf-8');
	return parser(content, { autoSortReleases: true });
}

function writeChangelog(changelog: Changelog): void {
	changelog.url = GITHUB_REPO_URL;
	changelog.format = 'markdownlint';
	writeFileSync(CHANGELOG_PATH, changelog.toString(), 'utf-8');
}

function releaseChangelog(version: string): void {
	const changelog = readChangelog();

	// Find the unreleased entry (no version set)
	const unreleased = changelog.releases.find((r) => !r.version);
	if (!unreleased) {
		fatalError('No unreleased section found in CHANGELOG.md');
	}

	unreleased.setVersion(version);
	unreleased.setDate(new Date());

	writeChangelog(changelog);
	console.log(pc.green(`Released changelog: [Unreleased] → [${version}]`));
}

function addUnreleasedSection(): void {
	const changelog = readChangelog();
	changelog.addRelease(new Release());
	writeChangelog(changelog);
	console.log(pc.green('Added [Unreleased] section to CHANGELOG.md'));
}

function extractReleaseBody(version: string): string {
	const changelog = readChangelog();
	const release = changelog.findRelease(version);
	if (!release) {
		fatalError(`Cannot find release ${version} in CHANGELOG.md`);
	}

	const parts: string[] = [];

	if (release.description?.trim()) {
		parts.push(release.description.trim());
		parts.push('');
	}

	release.changes.forEach((changes, type) => {
		if (changes.length === 0) return;
		parts.push(`### ${type.charAt(0).toUpperCase() + type.slice(1)}`);
		changes.forEach((change) => {
			parts.push(change.toString());
		});
		parts.push('');
	});

	return parts.join('\n').trim();
}

// ---------------------------------------------------------------------------
// File bumping
// ---------------------------------------------------------------------------

function bumpPackageJson(currentVersion: string, newVersion: string): void {
	const pkg = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
	pkg.version = newVersion;
	writeFileSync(PACKAGE_JSON_PATH, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
	console.log(pc.green(`Bumped version in package.json: ${currentVersion} → ${newVersion}`));
}

function bumpBuildGradle(currentVersion: string, newVersion: string): void {
	let content = readFileSync(BUILD_GRADLE_PATH, 'utf-8');

	// Replace versionName
	const versionNameRegex = new RegExp(`(versionName\\s+)"${escapeRegex(currentVersion)}"`);
	if (!versionNameRegex.test(content)) {
		fatalError(`Could not find versionName "${currentVersion}" in build.gradle`);
	}
	content = content.replace(versionNameRegex, `$1"${newVersion}"`);

	// Replace versionCode
	const oldVersionCode = content.match(/versionCode\s+(\d+)/);
	const versionCodeRegex = /(versionCode\s+)\d+/;
	if (!versionCodeRegex.test(content)) {
		fatalError('Could not find versionCode in build.gradle');
	}
	const newVersionCode = getVersionCode(newVersion);
	content = content.replace(versionCodeRegex, `$1${newVersionCode}`);

	writeFileSync(BUILD_GRADLE_PATH, content, 'utf-8');
	console.log(
		pc.green(
			`Bumped version in build.gradle: ${currentVersion} → ${newVersion} (versionCode: ${oldVersionCode ? oldVersionCode[1] : '?'} → ${newVersionCode})`
		)
	);
}

function escapeRegex(str: string): string {
	return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Git operations
// ---------------------------------------------------------------------------

async function getCurrentBranch(): Promise<string> {
	return (await git.status()).current ?? '';
}

async function gitStageAllAndCommit(message: string): Promise<void> {
	await git.add('.');
	await git.commit(message);
	console.log(pc.green(`Committed: ${message}`));
}

async function gitMergeToMain(releaseBranch: string): Promise<void> {
	console.log(pc.blue('Checking out main…'));
	await git.checkout('main');
	console.log(pc.blue(`Merging ${releaseBranch} into main…`));
	await git.merge([
		releaseBranch,
		'--no-ff',
		'--commit',
		'--no-edit',
	]);
	console.log(pc.green(`Merged ${releaseBranch} into main`));
}

async function gitTagAndPush(version: string): Promise<void> {
	const tagName = `v${version}`;
	await git.addTag(tagName);
	await git.push();
	await git.push(['origin', tagName]);
	console.log(pc.green(`Pushed tag ${tagName}`));
}

async function gitMergeToDevelopment(releaseBranch: string): Promise<void> {
	console.log(pc.blue('Checking out development…'));
	await git.checkout('development');
	console.log(pc.blue(`Merging ${releaseBranch} into development…`));
	await git.merge([
		releaseBranch,
		'--no-ff',
		'--commit',
		'--no-edit',
	]);
	console.log(pc.green(`Merged ${releaseBranch} into development`));
}

async function gitStageChangelogAndCommit(message: string): Promise<void> {
	await git.add('CHANGELOG.md');
	await git.commit(message);
	console.log(pc.green(`Committed: ${message}`));
}

async function gitPush(): Promise<void> {
	await git.push();
	console.log(pc.green('Pushed to origin'));
}

// ---------------------------------------------------------------------------
// GitHub release
// ---------------------------------------------------------------------------

interface RepoInfo {
	owner: string;
	repo: string;
}

function getRepoInfo(): RepoInfo {
	const remoteUrl = execSync('git remote get-url origin', {
		encoding: 'utf-8',
		cwd: ROOT,
	}).trim();

	// git@github.com:owner/repo.git
	const sshMatch = remoteUrl.match(/git@github\.com:([^/]+)\/(.+?)\.git$/);
	if (sshMatch) {
		return { owner: sshMatch[1], repo: sshMatch[2] };
	}

	// https://github.com/owner/repo.git
	const httpsMatch = remoteUrl.match(/https?:\/\/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
	if (httpsMatch) {
		return { owner: httpsMatch[1], repo: httpsMatch[2].replace(/\.git$/, '') };
	}

	fatalError('Could not parse GitHub owner/repo from git remote origin');
}

async function findReleaseByTag(
	octokit: Octokit,
	owner: string,
	repo: string,
	tag: string
): Promise<{ id: number } | null> {
	try {
		const { data } = await octokit.rest.repos.getReleaseByTag({
			owner,
			repo,
			tag,
		});
		return { id: data.id };
	} catch (err: any) {
		if (err.status === 404) {
			return null;
		}
		throw err;
	}
}

async function createGitHubRelease(version: string): Promise<void> {
	const token = process.env.GITHUB_TOKEN;
	if (!token) {
		fatalError(
			'GITHUB_TOKEN environment variable is required to create a GitHub release. ' +
				'Generate one at https://github.com/settings/tokens (scope: repo).'
		);
	}

	const octokit = new Octokit({ auth: token });
	const { owner, repo } = getRepoInfo();
	const tagName = `v${version}`;
	const body = extractReleaseBody(version);

	const existingRelease = await findReleaseByTag(octokit, owner, repo, tagName);

	if (existingRelease) {
		await octokit.rest.repos.updateRelease({
			owner,
			repo,
			release_id: existingRelease.id,
			tag_name: tagName,
			name: tagName,
			body,
			draft: false,
		});
		console.log(pc.green(`Updated GitHub release: ${tagName}`));
	} else {
		await octokit.rest.repos.createRelease({
			owner,
			repo,
			tag_name: tagName,
			name: tagName,
			body,
			draft: false,
		});
		console.log(pc.green(`Created GitHub release: ${tagName}`));
	}
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export const publish = async (): Promise<void> => {
	// 1. Parse version from CLI args
	const version = parseVersionArg();
	const versionCode = getVersionCode(version);
	console.log(pc.blue(`Publishing v${version} (versionCode: ${versionCode})…`));

	// 2. Pre-flight validations
	await validateVersionIsHigher(version);
	await checkCleanWorkingTree();
	checkChangelogHasUnreleased();
	await checkBranchIsRelease();
	runTypeCheck();

	// 3. Bump versions in files
	const currentVersion = getCurrentVersion();
	bumpPackageJson(currentVersion, version);
	bumpBuildGradle(currentVersion, version);

	// 4. Release changelog
	releaseChangelog(version);

	// 5. Stage & commit on release branch
	await gitStageAllAndCommit(`Bump version ${version}`);

	// 6. Merge to main, tag, push
	const releaseBranch = await getCurrentBranch();
	await gitMergeToMain(releaseBranch);
	await gitTagAndPush(version);

	// 7. GitHub release
	await createGitHubRelease(version);

	// 8. Merge to development
	await gitMergeToDevelopment(releaseBranch);

	// 9. Re-add [Unreleased] section, commit, push
	addUnreleasedSection();
	await gitStageChangelogAndCommit('Add [Unreleased] section to CHANGELOG.md');
	await gitPush();

	console.log(pc.green(`Done — v${version} published successfully.`));
};
