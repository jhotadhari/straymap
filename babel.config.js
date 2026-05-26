module.exports = {
	presets: [
		// '@babel/preset-flow',
		'module:@react-native/babel-preset',
	],
	plugins: [
		[
			'inline-import',
			{
				extensions: ['.sql'],
			},
		],
		'react-native-reanimated/plugin', // `react-native-reanimated/plugin` has to be listed last.
	],
	env: {
		production: {
			plugins: ['react-native-paper/babel'],
		},
	},
};
