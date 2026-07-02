export default {
	repo: 'https://github.com/jhotadhari/straymap',
	publish: { npm: false, github: true },
	bumpFiles: [
		{ path: 'package.json', type: 'json', key: 'version' },
		{ path: 'android/app/build.gradle', type: 'gradle' },
	],
	versionCode: {
		multiplier: { major: 1_000_000, minor: 10_000, patch: 100 },
		preReleaseOffsets: { alpha: 0, beta: 33, rc: 66 },
	},
	preflight: {
		typecheck: 'yarn typecheck',
		lint: false,
		test: false,
	},
};
