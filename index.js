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
import { initializeFromStorage as initializeFromStorage_appearance } from './src/store/features/appearance/connectStorage';
import { initializeFromStorage as initializeFromStorage_general } from './src/store/features/general/connectStorage';

initializeFromStorage_appearance( store );
initializeFromStorage_general( store );

const AppWithStore = () => (
    <Provider store={store}>
        <App/>
    </Provider>
);

AppRegistry.registerComponent( appName, () => AppWithStore );
