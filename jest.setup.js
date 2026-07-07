/**
 * Jest setup file — runs before each test suite.
 *
 * Mocks native modules and globals that crash on desktop JVM
 * (the same strategy the Java tests use with JavaOnlyMap).
 */

// ---------------------------------------------------------------------------
// react-native NativeModules — nothing is linked in a Jest environment
// ---------------------------------------------------------------------------
const { NativeModules } = require('react-native');

// Prevent post-teardown dynamic imports from the real useColorScheme getter.
// The getter in react-native/index.js triggers a lazy require that can land
// after the Jest environment shuts down. Replace it with a simple stub.
Object.defineProperty(require('react-native'), 'useColorScheme', {
	value: jest.fn(() => 'light'),
	writable: true,
	configurable: true,
});

// HelperModule — exposes app directories to JS
NativeModules.HelperModule = {
	getAppDirs: jest.fn().mockResolvedValue({
		appInternal: '/mock/app/internal',
		externalMediaDirs: ['/mock/media/0'],
		externalFileDirs: ['/mock/files/0'],
		externalCacheDirs: ['/mock/cache/0'],
		internalCacheDirs: ['/mock/cache/internal'],
		dirs: {
			databases: '/mock/app/internal/databases',
			mapfiles: '/mock/media/0/mapfiles',
			mapstyles: '/mock/media/0/mapstyles',
			dem: '/mock/media/0/dem',
			export: '/mock/media/0/export',
			marker: '/mock/media/0/marker',
			cursor: '/mock/media/0/cursor',
		},
	}),
};

// FsModule — filesystem listing/deletion
NativeModules.FsModule = {
	getInfo: jest.fn().mockResolvedValue({
		navParent: '/mock/parent',
		navChildren: [],
	}),
	deleteDir: jest.fn().mockResolvedValue(true),
	getCacheInfo: jest.fn().mockResolvedValue([]),
};

// ---------------------------------------------------------------------------
// react-native-default-preference — key-value persistence
// ---------------------------------------------------------------------------
jest.mock('react-native-default-preference', () => ({
	default: {
		get: jest.fn().mockResolvedValue(null),
		set: jest.fn().mockResolvedValue(undefined),
		clear: jest.fn().mockResolvedValue(undefined),
		getAll: jest.fn().mockResolvedValue({}),
	},
	get: jest.fn().mockResolvedValue(null),
	set: jest.fn().mockResolvedValue(undefined),
	clear: jest.fn().mockResolvedValue(undefined),
	getAll: jest.fn().mockResolvedValue({}),
}));

// ---------------------------------------------------------------------------
// op-sqlite — native SQLite binding
// ---------------------------------------------------------------------------
jest.mock('@op-engineering/op-sqlite', () => ({
	open: jest.fn(() => ({
		execute: jest.fn().mockResolvedValue({ rows: [], insertId: 0 }),
		executeAsync: jest.fn().mockResolvedValue({ rows: [], insertId: 0 }),
		transaction: jest.fn((cb) =>
			cb({
				execute: jest.fn().mockResolvedValue({ rows: [], insertId: 0 }),
			})
		),
		close: jest.fn(),
		loadExtension: jest.fn().mockResolvedValue(undefined),
	})),
}));

// ---------------------------------------------------------------------------
// react-native-mapsforge-vtm — map rendering
// ---------------------------------------------------------------------------
jest.mock('react-native-mapsforge-vtm', () => ({
	MapContainer: 'MapContainer',
	LayerHillshading: {
		shadingAlgorithms: { HILLSHADE: 0, SLOPESHADE: 1 },
		shadingAlgorithmsOptionKeys: { 0: [], 1: [] },
	},
}));

// ---------------------------------------------------------------------------
// react-native-brouter — routing engine
// ---------------------------------------------------------------------------
jest.mock('react-native-brouter', () => ({
	getRoute: jest.fn().mockResolvedValue({
		raw: JSON.stringify({
			type: 'FeatureCollection',
			features: [],
		}),
		format: 'json',
	}),
}));

jest.mock('react-native-brouter/geojson', () => ({
	getRoute: jest.fn().mockResolvedValue({
		raw: JSON.stringify({
			type: 'FeatureCollection',
			features: [],
		}),
		format: 'json',
		parsed: {
			track: {
				type: 'FeatureCollection',
				features: [],
			},
			waypoints: {
				type: 'FeatureCollection',
				features: [],
			},
			summary: {},
		},
	}),
}));

// ---------------------------------------------------------------------------
// react-native-uuid — UUID generation
// ---------------------------------------------------------------------------
jest.mock('react-native-uuid', () => ({
	v4: jest.fn(() => 'mock-uuid-0000-0000-000000000000'),
}));

// ---------------------------------------------------------------------------
// react-native-paper — Material Design components
// ---------------------------------------------------------------------------
const mockPaperColors = {
	primary: '#000',
	background: '#fff',
	surface: '#fff',
	accent: '#000',
	error: '#f00',
	text: '#000',
	onSurface: '#000',
	disabled: '#ccc',
	placeholder: '#999',
	backdrop: '#fff',
	onBackground: '#000',
	outline: '#ccc',
	elevation: {},
	secondaryContainer: '#eee',
	onSecondaryContainer: '#000',
	primaryContainer: '#ddd',
	onPrimaryContainer: '#000',
	surfaceVariant: '#f5f5f5',
};

jest.mock('react-native-paper', () => {
	const { View } = require('react-native');
	return {
		Provider: View,
		Button: View,
		TextInput: View,
		IconButton: View,
		Checkbox: View,
		RadioButton: View,
		Switch: View,
		List: { Item: View, Section: View },
		Menu: View,
		Modal: View,
		Portal: View,
		Snackbar: View,
		Appbar: View,
		Card: View,
		Divider: View,
		MD3DarkTheme: { colors: { ...mockPaperColors } },
		MD3LightTheme: { colors: { ...mockPaperColors } },
		MD2DarkTheme: { colors: { ...mockPaperColors } },
		MD2LightTheme: { colors: { ...mockPaperColors } },
		useTheme: jest.fn(() => ({
			colors: { ...mockPaperColors },
			fonts: {},
		})),
	};
});

// ---------------------------------------------------------------------------
// react-native-reanimated — animation engine
// ---------------------------------------------------------------------------
jest.mock('react-native-reanimated', () => {
	const { View, Text } = require('react-native');
	return {
		default: {
			View,
			Text,
			createAnimatedComponent: (component) => component,
			useSharedValue: jest.fn((val) => ({ value: val })),
			useAnimatedStyle: jest.fn(() => ({})),
			withTiming: jest.fn((val) => val),
			withSpring: jest.fn((val) => val),
		},
		View,
		Text,
		createAnimatedComponent: (component) => component,
		useSharedValue: jest.fn((val) => ({ value: val })),
		useAnimatedStyle: jest.fn(() => ({})),
		withTiming: jest.fn((val) => val),
		withSpring: jest.fn((val) => val),
	};
});

// ---------------------------------------------------------------------------
// react-native-safe-area-context
// ---------------------------------------------------------------------------
jest.mock('react-native-safe-area-context', () => ({
	SafeAreaProvider: 'SafeAreaProvider',
	SafeAreaConsumer: 'SafeAreaConsumer',
	useSafeAreaInsets: jest.fn(() => ({
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
	})),
}));

// ---------------------------------------------------------------------------
// react-native-gesture-handler
// ---------------------------------------------------------------------------
jest.mock('react-native-gesture-handler', () => {
	const { View } = require('react-native');
	return {
		GestureHandlerRootView: View,
		PanGestureHandler: View,
		TapGestureHandler: View,
		ScrollView: View,
		FlatList: View,
		State: {},
		Directions: {},
	};
});

// ---------------------------------------------------------------------------
// @react-native-community/blur
// ---------------------------------------------------------------------------
jest.mock('@react-native-community/blur', () => 'BlurView');

// ---------------------------------------------------------------------------
// @react-native-vector-icons/* — icon libraries
// ---------------------------------------------------------------------------
jest.mock('@react-native-vector-icons/common', () => ({
	createIconSet: () => 'Icon',
}));
jest.mock('@react-native-vector-icons/material-icons', () => 'MaterialIcon');
jest.mock('@react-native-vector-icons/material-design-icons', () => 'MaterialDesignIcon');
jest.mock('@react-native-vector-icons/feather', () => 'Feather');

// ---------------------------------------------------------------------------
// react-native-sortables — drag-and-drop sortable components
// ---------------------------------------------------------------------------
jest.mock('react-native-sortables', () => {
	const { View } = require('react-native');
	return {
		default: View,
		SortableFlex: View,
		SortableGrid: View,
		SortableLayer: View,
	};
});

// ---------------------------------------------------------------------------
// @klarna/react-native-vector-drawable — SVG drawable rendering
// ---------------------------------------------------------------------------
jest.mock('@klarna/react-native-vector-drawable', () => 'VectorDrawable');

// ---------------------------------------------------------------------------
// react-i18next — internationalization framework
// ---------------------------------------------------------------------------
jest.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key) => key,
		i18n: {
			changeLanguage: jest.fn(),
			language: 'en',
		},
	}),
	initReactI18next: {
		type: '3rdParty',
		init: () => {},
	},
}));

// ---------------------------------------------------------------------------
// Source modules that cause deep import chains in slice files.
// Mocking them at the module boundary prevents the cascade.
// ---------------------------------------------------------------------------
jest.mock('./src/store/features/baseMap/components/controls/layers/LayersControl', () => ({
	mapTypeOptions: [],
}));

// i18n module: import chain from dbLoader/utils → i18n → features/index → all slices
jest.mock('./src/assets/i18n/i18n', () => {
	const mockI18n = {
		t: (key) => key,
		changeLanguage: jest.fn().mockResolvedValue(undefined),
		language: 'en',
		use: () => mockI18n,
		init: () => mockI18n,
	};
	return {
		__esModule: true,
		default: mockI18n,
		changeLang: jest.fn(),
	};
});

// listenerMiddleware — no mock needed; the real module works because
// its Dev-mode listener is gated by globalThis.shouldLog.dispatchAction (false).

// routing utils — mock the native brouter import
jest.mock('./src/store/features/routing/utils', () => {
	const actual = jest.requireActual('./src/store/features/routing/utils');
	return {
		...actual,
		getCoordsFromRouting: jest.fn().mockResolvedValue([]),
	};
});

// ---------------------------------------------------------------------------
// react-native-paper-dates — date picker (imported via LinesTable → FilterDateModal)
// ---------------------------------------------------------------------------
jest.mock('react-native-paper-dates', () => ({
	DatePickerModal: 'DatePickerModal',
}));

// ---------------------------------------------------------------------------
// react-native-fs — filesystem access
// ---------------------------------------------------------------------------
jest.mock('react-native-fs', () => ({
	RNFSFileTypeRegular: 'regular',
	RNFSFileTypeDirectory: 'directory',
	exists: jest.fn().mockResolvedValue(true),
	readDir: jest.fn().mockResolvedValue([]),
	readFile: jest.fn().mockResolvedValue(''),
	writeFile: jest.fn().mockResolvedValue(undefined),
	unlink: jest.fn().mockResolvedValue(undefined),
	mkdir: jest.fn().mockResolvedValue(undefined),
	downloadFile: jest.fn().mockResolvedValue({}),
	CachesDirectoryPath: '/mock/caches',
	DocumentDirectoryPath: '/mock/documents',
	ExternalDirectoryPath: '/mock/external',
	MainBundlePath: '/mock/bundle',
}));

// ---------------------------------------------------------------------------
// FeatureRegistry — mock that returns legacy data for tests that depend on
// selectors reading drawer items, dashboard elements, etc.
// ---------------------------------------------------------------------------
jest.mock('./src/store/features/FeatureRegistry', () => {
	const mockDrawerItems = {
		maps: { key: 'maps' },
		routing: { key: 'routing' },
		position: { key: 'position' },
		searchPlace: { key: 'searchPlace' },
		lines: { key: 'lines' },
		waypoints: { key: 'waypoints' },
	};
	return {
		featureRegistry: {
			getSettingsItems: jest.fn(() => []),
			getSettingsControls: jest.fn(() => []),
			getDashboardElements: jest.fn(() => ({})),
			getDrawerItems: jest.fn(() => mockDrawerItems),
			getMapViewComponents: jest.fn(() => []),
			registerAll: jest.fn(),
		},
		FeatureRegistry: jest.fn(),
	};
});

// ---------------------------------------------------------------------------
// Global mocks
// ---------------------------------------------------------------------------

// __DEV__ is true in Jest
global.__DEV__ = true;

// @react-native/jest-preset sets IS_REACT_ACT_ENVIRONMENT = true, which makes
// react-test-renderer warn when a render is not wrapped in act(). Override to
// false — the only component test (App.test.tsx) is a smoke test that doesn't
// need concurrent act() semantics, and all other tests are pure logic tests.
global.IS_REACT_ACT_ENVIRONMENT = false;

// structuredClone (not available in all Node versions)
global.structuredClone = global.structuredClone || ((val) => JSON.parse(JSON.stringify(val)));

// globalThis.shouldLog — used by listenerMiddleware and store
globalThis.shouldLog = {
	saveToStorage: false,
	dispatchAction: false,
	serializableCheck: false,
	immutableStateInvariant: false,
	drizzle: false,
	i18n: false,
};

// canvas (used by turf? not usually, but safe)
global.HTMLCanvasElement = global.HTMLCanvasElement || function () {};
