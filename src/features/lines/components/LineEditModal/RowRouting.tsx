/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { TextStyle, View } from 'react-native';
import { useMap } from 'react-native-mapsforge-vtm';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoLabelRow from '../../../../components/generic/infoWrapper/InfoLabelRow';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineTemp } from '../../selectors';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import { selectIsRouting } from '../../../routing/selectors';
import { setIsRouting } from '../../../routing/slice';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { sharedStyles } from './sharedDeps';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { AppContext } from '../../../../Context';
import { MAP_ANIMATION_PADDING_PX } from '../../../../constants';
import { bbox as turfBbox } from '@turf/turf';
import { setUiItemKeys } from '../../../ui/slice';
import { useButtonProps } from '../../../../compose/useButtonProps';

const renderIconRouting = ({ color }: { color: TextStyle['color'] }) => (
	<IconRouting color={color} />
);

const RowRouting: FC = () => {
	const theme = useTheme();
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const lineTemp = useAppSelector(selectLineTemp);

	const isRouting = useAppSelector(selectIsRouting);

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { flyToBounds } = useMap(mapViewNativeNodeHandle);

	const { route, selectLine, line, onDismiss } = useContext(LineEditModalContext);

	const handlePress = useCallback(() => {
		if (lineTemp?.id && route?.id) {
			onDismiss();
			dispatch(setIsRouting(route.id));
			selectLine(lineTemp.id, true);
			activateRoutingDrawerItem();
			// Close LinesTable.
			dispatch(setUiItemKeys([]));
			// flyToBounds
			if (line?.envelope && mapViewNativeNodeHandle) {
				const bbox = turfBbox(line.envelope);
				flyToBounds(bbox, { paddingPx: MAP_ANIMATION_PADDING_PX });
			}
		}
	}, [
		flyToBounds,
		mapViewNativeNodeHandle,
		lineTemp?.id,
		route?.id,
		line?.envelope,
		activateRoutingDrawerItem,
		dispatch,
		selectLine,
		onDismiss,
	]);

	const disabled = !route?.id || isRouting === route?.id;

	const label = useMemo(() => {
		if (!route?.id) {
			return t('lines.noRoutingData');
		} else if (route?.id && isRouting === route?.id) {
			return t('lines.alreadyRouting');
		} else {
			return t('lines.loadRouting');
		}
	}, [
		t,
		isRouting,
		route?.id,
	]);

	const buttonProps = useButtonProps({
		mode: 'outlined',
		disabled,
		paddingHorizontal: true,
	});

	return (
		<InfoLabelRow
			label={t('lines.routing')}
			Info={t('lines.hintRouting')}
		>
			<ButtonHighlight
				{...buttonProps}
				compact={true}
				onPress={handlePress}
				icon={renderIconRouting}
			>
				{label}
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowRouting;
