/**
 * External dependencies
 */
import React, { FC, useMemo } from 'react';
import { Text } from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import ListItem from './ListItem';
import MenuControl, { MenuControlProps } from '../primitives/MenuControl';

interface Props extends Omit<MenuControlProps, 'AnchorComponent'> {
	anchorLabel?: string;
	anchorLabelAppendSelected?: boolean;
	anchorIcon?: (props: { color: string; style: ListStyle }) => React.ReactNode;
	listItemStyle?: ViewStyle;
}

const ListItemMenuControl: FC<Props> = ({
	menuItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorLabelAppendSelected = false,
	anchorIcon,
	listItemStyle,
}) => {
	const { t } = useTranslation();

	const title = useMemo(() => {
		if (!anchorLabelAppendSelected) {
			return anchorLabel;
		}
		return (
			<View>
				<Text>{anchorLabel}</Text>
				<Text>
					{'(' +
						t(
							get(
								options?.find((opt) => opt.key === value),
								'label',
								''
							)
						) +
						')'}
				</Text>
			</View>
		);
	}, [
		anchorLabelAppendSelected,
		anchorLabel,
		t,
		options,
		value,
	]);

	const AnchorComponent = useMemo(() => {
		return ({ onPress }: { onPress: () => void }) => (
			<ListItem
				style={listItemStyle}
				title={title}
				icon={anchorIcon ? anchorIcon : undefined}
				onPress={onPress}
			/>
		);
	}, [
		listItemStyle,
		title,
		anchorIcon,
	]);

	return (
		<MenuControl
			AnchorComponent={AnchorComponent}
			menuItemStyle={menuItemStyle}
			options={options}
			value={value}
			setValue={setValue}
		/>
	);
};

export default ListItemMenuControl;
