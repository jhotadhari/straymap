/**
 * External dependencies
 */
import React, { useMemo, useState } from 'react';
import { Menu, Text, useTheme } from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';
import MenuItem from '../MenuItem';
import ListItem from '../ListItem';

const ListItemMenuControl = ({
	listItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorLabelAppendSelected = false,
	anchorIcon,
}: {
	listItemStyle?: ViewStyle;
	anchorLabel: string;
	anchorLabelAppendSelected?: boolean;
	options?: OptionBase[];
	value?: string;
	setValue?: (newValue: string) => void;
	anchorIcon?: (props: { color: string; style: ListStyle }) => React.ReactNode;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);
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

	return (
		<Menu
			contentStyle={{
				borderColor: theme.colors.outline,
				borderWidth: 1,
			}}
			visible={visible}
			onDismiss={() => setVisible(false)}
			anchor={
				<ListItem
					style={listItemStyle}
					title={title}
					icon={anchorIcon ? anchorIcon : undefined}
					onPress={() => setVisible(!visible)}
				/>
			}
		>
			{options &&
				[...options].map((opt) => (
					<MenuItem
						key={opt.key}
						onPress={() => {
							setValue && setValue(opt.key);
							setVisible(false);
						}}
						title={t(opt.label)}
						active={opt.key === value}
					/>
				))}
		</Menu>
	);
};

export default ListItemMenuControl;
