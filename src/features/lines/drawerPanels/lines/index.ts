/**
 * Internal dependencies
 */
import { DrawerPanel } from '../../../drawers/types';
import LinesIcon from '../../components/LinesIcon';
import DisplayComponent from './DisplayComponent';

export default {
	key: 'lines',
	label: 'lines.tracksRoutes',
	DisplayComponent,
	IconComponent: LinesIcon,
} as DrawerPanel;
