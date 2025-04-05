/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './src/components/App';
import { name as appName } from './app.json';
// structuredClone polyfill
import structuredClone from "@ungap/structured-clone";
if ( ! ( 'structuredClone' in globalThis ) ) {
    globalThis.structuredClone = structuredClone;
}

AppRegistry.registerComponent( appName, () => App );
