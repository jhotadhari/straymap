/**
 * Internal dependencies
 */

import { TextStyle } from 'react-native';
import IconCustom from '../../../../components/generic/primitives/IconCustom';

const IconComponent = ({ color }: { color: TextStyle['color'] }) => {
	return (
		<IconCustom
			style={{ color }}
			name="routes_search"
			size={25}
		/>
	);
};

export default IconComponent;
