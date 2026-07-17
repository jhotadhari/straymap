/**
 * External dependencies
 */
import { FC } from 'react';
import { TextStyle } from 'react-native';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';

/**
 * Internal dependencies
 */
import IconFontGis from '../../../components/generic/primitives/IconFontGis';

const BaseMapIcon: FC<{ color?: TextStyle['color']; style?: ListStyle; size?: number }> = (
	props
) => (
	<IconFontGis
		name="map-o"
		{...props}
	/>
);

export default BaseMapIcon;
