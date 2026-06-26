module.exports = {
	root: true,
	extends: '@react-native',
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
	],
};
