module.exports = {
	root: true,
	extends: '@react-native',
	ignorePatterns: ['.yalc/'],
	rules: {
		yoda: 'off',
		'no-undef-init': 'off',
		'dot-notation': 'off',
		'@typescript-eslint/no-shadow': 'off',
		'no-useless-escape': 'off',
		'react/no-unstable-nested-components': ['warn', { allowAsProps: true }],
	},
	globals: {
		globalThis: false,
	},
	overrides: [
		{
			files: ['scripts/**/*.js'],
			env: {
				node: true,
			},
		},
		{
			files: [
				'jest.setup.js',
				'**/__tests__/**/*.{js,jsx,ts,tsx}',
				'**/__mocks__/**/*.{js,jsx,ts,tsx}',
			],
			env: {
				jest: true,
			},
		},
	],
};
