/**
 * External dependencies
 */
import React, { ReactNode, useEffect, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { Style as ListStyle } from 'react-native-paper/lib/typescript/components/List/utils';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ListItem from '../ListItem';
import { LayoutChangeEvent, StyleSheet, View, ViewStyle } from 'react-native';
import ModalWrapper from '../ModalWrapper';
import ButtonHighlight from '../ButtonHighlight';
import { get } from 'lodash-es';

const ListItemModalControl = ({
	listItemStyle,
	hasHeaderBackPress = false,
	children,
	anchorLabel,
	header,
	headerPrepend,
	innerStyle,
	backgroundBlur = true,
	scrollEnabled = true,
	onLayout,
	anchorIcon,
	belowModal = false,
	afterDismiss,
}: {
	listItemStyle?: ViewStyle;
	hasHeaderBackPress?: boolean;
	children: ReactNode;
	anchorLabel: string;
	header: string;
	headerPrepend?: string | ReactNode;
	innerStyle?: null | ViewStyle;
	backgroundBlur?: boolean;
	scrollEnabled?: boolean;
	onLayout?: (event: LayoutChangeEvent) => void;
	anchorIcon?: (props: { color: string; style: ListStyle }) => React.ReactNode;
	belowModal?: ReactNode | null;
	afterDismiss?: () => void;
}) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const [visible, setVisible] = useState(false);

	useEffect(() => {
		if (!visible && afterDismiss) {
			afterDismiss();
		}
	}, [visible]);

	return (
		<View>
			{visible && (
				<ModalWrapper
					visible={visible}
					onDismiss={() => {
						setVisible(false);
						// setEditLayer && setEditLayer( null );
					}}
					header={header}
					headerPrepend={headerPrepend}
					onHeaderBackPress={hasHeaderBackPress ? () => setVisible(false) : undefined}
					innerStyle={innerStyle}
					backgroundBlur={backgroundBlur}
					scrollEnabled={scrollEnabled}
					onLayout={onLayout}
					belowModal={belowModal}
				>
					<View style={styles.content}>
						{children}

						<ButtonHighlight
							style={styles.controls}
							onPress={() => {
								setVisible(false);
							}}
							mode="contained"
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{t('ok')}</Text>
						</ButtonHighlight>
					</View>
				</ModalWrapper>
			)}

			<ListItem
				style={listItemStyle}
				title={anchorLabel}
				icon={anchorIcon ? anchorIcon : undefined}
				onPress={() => setVisible(!visible)}
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
