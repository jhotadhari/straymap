/**
 * @format
 */

/**
 * External dependencies
 */
import { AppRegistry } from 'react-native';
import { Provider } from 'react-redux';
// structuredClone polyfill
import structuredClone from "@ungap/structured-clone";
if ( ! ( 'structuredClone' in globalThis ) ) {
    globalThis.structuredClone = structuredClone;
}

/**
 * Internal dependencies
 */
import { name as appName } from './app.json';
import App from './src/components/App';
import { store } from './src/store/store';
import { initializeFromStorage } from './src/store/features/appearance/connectStorage';

initializeFromStorage( store );

const AppWithStore = () => (
    <Provider store={store}>
        <App/>
    </Provider>
);

AppRegistry.registerComponent( appName, () => AppWithStore );
