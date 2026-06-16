/**
 * Internal dependencies
 */
import { DrawerItem } from '../../types';
import DisplayComponent from './DisplayComponent';

export default {
	key: 'lines',
	label: 'lines.tracksRoutes',
	DisplayComponentScroll: DisplayComponent,	// ??? change to DisplayComponent to make header buttons fixed. see routing drawer
	// IconComponent,
	iconSource: 'go-kart-track',
} as DrawerItem;
