/**
 * External dependencies
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';
import { get } from 'lodash-es';
import { ScrollView, View, ViewStyle } from 'react-native';

/**
 * Internal dependencies
 */
import { OptionBase } from '../../../types';
import MenuItem from './MenuItem';
import ListItem from './ListItem';
import Popover from 'react-native-popover-view';

const ListItemMenuControl = ({
	listItemStyle,
	menuItemStyle,
	options,
	value,
	setValue,
	anchorLabel,
	anchorLabelAppendSelected = false,
	anchorIcon,
}: {
	listItemStyle?: ViewStyle;
	menuItemStyle?: ViewStyle | ((idx: number) => ViewStyle);
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

	const popoverStyle = useMemo(
		() => ({
			backgroundColor: theme.colors.background,
			borderWidth: 1,
			borderColor: theme.colors.outline,
			minWidth: 100,
		}),
		[theme]
	);

	const handleRequestClose = useCallback(() => setVisible(false), []);

	const handleAnchorPress = useCallback(() => setVisible((isVisible) => !isVisible), []);

	const handleOptionPress = useCallback(
		(key: string) => {
			setValue && setValue(key);
			setVisible(false);
		},
		[setValue]
	);

	const anchorRef = useRef<View>(null);

	return (
		<>
			<View ref={anchorRef}>
				<ListItem
					style={listItemStyle}
					title={title}
					icon={anchorIcon ? anchorIcon : undefined}
					onPress={handleAnchorPress}
				/>
			</View>
			<Popover
				popoverStyle={popoverStyle}
				arrowSize={arrowSize}
				isVisible={visible}
				onRequestClose={handleRequestClose}
				from={anchorRef as React.RefObject<React.Component<{}, {}, any>>}
			>
				{options && (
					<ScrollView>
						{options.map((opt, idx) => (
							<MenuItem
								style={
									menuItemStyle instanceof Function
										? menuItemStyle(idx)
										: menuItemStyle
								}
								key={opt.key}
								onPress={() => handleOptionPress(opt.key)}
								title={t(opt.label)}
								active={opt.key === value}
							/>
						))}
					</ScrollView>
				)}
			</Popover>
		</>
	);
};

const arrowSize = { height: 0, width: 0 };

export default ListItemMenuControl;
