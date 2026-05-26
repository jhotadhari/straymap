/**
 * @format
 */

/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
import 'intl-pluralrules';
// structuredClone polyfill
import structuredClone from '@ungap/structured-clone';
if (!('structuredClone' in globalThis)) {
	globalThis.structuredClone = structuredClone;
}

/**
 * Internal dependencies
 */
import './src/globals';
import { name as appName } from './app.json';
import './src/assets/i18n/i18n';
import App from './src/components/App';
import { store } from './src/store/store';

const AppWithStore = () => (
	<Provider store={store}>
		<App />
	</Provider>
);

AppRegistry.registerComponent(appName, () => AppWithStore);
