module.exports = {
	preset: '@react-native/jest-preset',
	setupFiles: ['./jest.setup.js'],
	transform: {
		'^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
		'^.+\\.(bmp|gif|jpg|jpeg|mp4|png|psd|svg|webp)$':
			'<rootDir>/node_modules/@react-native/jest-preset/jest/assetFileTransformer.js',
	},
	transformIgnorePatterns: [
		'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-.*|react-native-.*|@reduxjs/toolkit|immer|redux|reselect|react-redux|lodash-es|defaults|slugify|sprintf-js|@tanstack|geojson|@turf|@klarna|react-i18next|i18next|array-move|drizzle-orm|esqlate-core)/)',
	],
	modulePathIgnorePatterns: [
		'<rootDir>/.claude/worktrees/',
	],
	moduleNameMapper: {
		'^react-native($|/.*)':
			'<rootDir>/node_modules/react-native/$1',
		'\\.(png|jpg|jpeg|gif|svg|ttf|woff|woff2|md)$':
			'<rootDir>/__mocks__/fileMock.js',
	},
	haste: {
		defaultPlatform: 'android',
	},
};
