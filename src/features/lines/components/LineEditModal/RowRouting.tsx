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
import { sharedStyles as appSharedStyles } from '../../../../sharedStyles';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { AppContext } from '../../../../Context';
import { MAP_ANIMATION_PADDING_PX } from '../../../../constants';
import { bbox as turfBbox } from '@turf/turf';
import { setUiItemKeys } from '../../../ui/slice';

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

	const buttonStyle = useMemo(
		() => ({
			borderColor: theme.colors.onBackground,
			...((!route?.id || isRouting === route?.id) && {
				...appSharedStyles.disabled,
				borderColor: theme.colors.onSurfaceDisabled,
			}),
		}),
		[
			theme,
			route?.id,
			isRouting,
		]
	);

	const disabled = useMemo(
		() => !route?.id || isRouting === route?.id,
		[
			route?.id,
			isRouting,
		]
	);

	return (
		<InfoLabelRow
			label={t('lines.routing')}
			Info={t('lines.hintRouting')}
		>
			<ButtonHighlight
				style={buttonStyle}
				mode="outlined"
				compact={true}
				disabled={disabled}
				onPress={handlePress}
				icon={renderIconRouting}
				contentStyle={sharedStyles.buttonContent}
				labelStyle={sharedStyles.buttonLabel}
				textColor={theme.colors.onBackground}
			>
				<View>
					{!route?.id && <Text>{t('lines.noRoutingData')}</Text>}
					{route?.id && isRouting !== route?.id && <Text>{t('lines.loadRouting')}</Text>}
					{route?.id && isRouting === route?.id && (
						<Text>{t('lines.alreadyRouting')}</Text>
					)}
				</View>
			</ButtonHighlight>
		</InfoLabelRow>
	);
};

export default RowRouting;
