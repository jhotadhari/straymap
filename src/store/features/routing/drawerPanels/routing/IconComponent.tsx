/**
 * Internal dependencies
 */

import { TextStyle } from 'react-native';
import IconIcomoon from '../../../../../components/generic/IconIcomoon';

const IconComponent = ({ color }: { color: TextStyle['color'] }) => {
	return (
		<IconIcomoon
			style={{ color }}
			name="routes_search"
			size={25}
		/>
	);
};

export default IconComponent;
