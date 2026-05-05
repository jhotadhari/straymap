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
import structuredClone from "@ungap/structured-clone";
if ( ! ( 'structuredClone' in globalThis ) ) {
    globalThis.structuredClone = structuredClone;
}

/**
 * Internal dependencies
 */
import { name as appName } from './app.json';
import './src/assets/i18n/i18n';
import App from './src/components/App';
import { store } from './src/store/store';
import { initializeFromStorage as initializeFromStorage_appearance } from './src/store/features/appearance/connectStorage';
import { initializeFromStorage as initializeFromStorage_general } from './src/store/features/general/connectStorage';
import { initializeFromStorage as initializeFromStorage_dirs } from './src/store/features/dirs/connectStorage';
import { initializeFromStorage as initializeFromStorage_ui } from './src/store/features/ui/connectStorage';
import { initializeFromStorage as initializeFromStorage_dashboard } from './src/store/features/dashboard/connectStorage';
import { initializeFromStorage as initializeFromStorage_baseMap } from './src/store/features/baseMap/connectStorage';

initializeFromStorage_appearance( store );
initializeFromStorage_general( store );
initializeFromStorage_dirs( store );
initializeFromStorage_ui( store );
initializeFromStorage_dashboard( store );
initializeFromStorage_baseMap( store );

const AppWithStore = () => (
    <Provider store={store}>
        <App/>
    </Provider>
);

AppRegistry.registerComponent( appName, () => AppWithStore );
