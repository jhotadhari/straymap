
/**
 * External dependencies
 */
import rnUuid from 'react-native-uuid';

/**
 * Internal dependencies
*/
import { LayerConfig, MapsforgeProfile } from './types';

export const getNewLayer = () : LayerConfig => ( {
    key: rnUuid.v4(),
    name: '',
    visible: true,
    type: null,
    options: {},
} );

export const getNewProfile = () : MapsforgeProfile => ( {
    key: rnUuid.v4(),
    name: '',
    theme: 'DEFAULT',
    renderStyle: null,
    renderOverlays: [],
	hasBuildings: true,
	hasLabels: true,
} );