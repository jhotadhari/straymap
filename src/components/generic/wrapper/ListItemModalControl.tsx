/**
 * External dependencies
 */
import React, { FC, ReactNode, useCallback, useEffect, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ListItem from './ListItem';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import ModalWrapper from './ModalWrapper';
import ButtonHighlight from '../primitives/ButtonHighlight';
import { get } from 'lodash-es';

const ListItemModalControl: FC<{
	listItemStyle?: ViewStyle;
	children: ReactNode;
	anchorLabel: string;
	header: string;
	innerStyle?: null | ViewStyle;
	backgroundBlur?: boolean;
	scrollEnabled?: boolean;
	onLayout?: (event: LayoutChangeEvent) => void;
	anchorIcon?: (props: { color: string; style: ListStyle }) => React.ReactNode;
	afterDismiss?: () => void;
}> = ({
	listItemStyle,
	children,
	anchorLabel,
	header,
	innerStyle,
	backgroundBlur = true,
	scrollEnabled = true,
	onLayout,
	anchorIcon,
	afterDismiss,
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!visible && afterDismiss) {
			afterDismiss();
		}
	}, [visible, afterDismiss]);

	const handleClose = useCallback(() => setVisible(false), []);

	const handleAnchorPress = useCallback(() => setVisible((isVisible) => !isVisible), []);

	return (
		<View>
			{visible && (
				<ModalWrapper
					visible={visible}
					onDismiss={handleClose}
					header={header}
					innerStyle={innerStyle}
					backgroundBlur={backgroundBlur}
					scrollEnabled={scrollEnabled}
					onLayout={onLayout}
				>
					<View style={styles.content}>{children}</View>
				</ModalWrapper>
			)}

			<ListItem
				style={listItemStyle}
				title={anchorLabel}
				icon={anchorIcon ? anchorIcon : undefined}
				onPress={handleAnchorPress}
			/>
		</View>
	);
};

const styles = StyleSheet.create({
	content: {
		gap: 32,
	},
	controls: {
		marginBottom: 40,
	},
});

export default ListItemModalControl;
