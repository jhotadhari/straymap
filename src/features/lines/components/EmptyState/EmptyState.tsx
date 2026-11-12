/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { useButtonProps } from '../../../../compose/useButtonProps';
import { useAppDispatch } from '../../../../store/hooks';
import { addUiItemKey } from '../../../ui/slice';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';

/**
 * Empty state of the lines drawer panel: no routes are on the map.
 * Offers three ways to add routes — open the routes browser, start
 * planning a route (opens the routing panel) or start recording a route
 * (opens the location/tracking panel). When one of those drawer panels
 * isn't assigned to any side, the activate helper shows the "add panel
 * to a side" modal instead.
 */
const EmptyState: FC = () => {
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { nestedIconColor: _nestedIconColor, ...buttonProps } = useButtonProps({});

	const openLinesBrowser = useCallback(() => dispatch(addUiItemKey('linesBrowser')), [dispatch]);

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');
	const activateTrackingDrawerItem = useActivateDrawerItem('tracking');

	return (
		<View style={styles.container}>
			<Text>{t('lines.noRoutesOnMap')}</Text>
			<Text style={styles.hint}>{t('lines.noRoutesOnMapHint')}</Text>

			<ButtonHighlight
				{...buttonProps}
				onPress={openLinesBrowser}
			>
				{t('lines.linesBrowser')}
			</ButtonHighlight>

			<ButtonHighlight
				{...buttonProps}
				onPress={() => activateRoutingDrawerItem()}
			>
				{t('lines.startPlanning')}
			</ButtonHighlight>

			<ButtonHighlight
				{...buttonProps}
				onPress={() => activateTrackingDrawerItem()}
			>
				{t('lines.startRecording')}
			</ButtonHighlight>
		</View>
	);
};

const styles = StyleSheet.create({
	container: {
		flex: 1,
		gap: 8,
		paddingHorizontal: 16,
	},
	hint: {
		opacity: 0.6,
		marginBottom: 8,
	},
});

export default EmptyState;
