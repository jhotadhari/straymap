/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { TextStyle, View } from 'react-native';
import { useMap } from 'react-native-mapsforge-vtm';
import { centerOfMass } from '@turf/turf';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectLineTemp } from '../../selectors';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import { selectIsRouting } from '../../../routing/selectors';
import { setIsRouting } from '../../../routing/slice';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { sharedStyles } from './sharedDeps';
import IconRouting from '../../../routing/drawerPanels/routing/IconComponent';
import { AppContext } from '../../../../Context';

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

	const { panTo } = useMap(mapViewNativeNodeHandle);

	const { route, selectLine, line } = useContext(LineEditModalContext);

	const handlePress = useCallback(() => {
		if (lineTemp?.id && route?.id) {
			// set bounds. ??? have to implement set bounds. use center for now,
			if (line?.envelope && mapViewNativeNodeHandle) {
				const centerPoint = centerOfMass(line?.envelope);
				panTo(centerPoint.geometry.coordinates);
			}
			dispatch(setIsRouting(route.id));
			selectLine(lineTemp.id, true);
			activateRoutingDrawerItem();
		}
	}, [
		panTo,
		mapViewNativeNodeHandle,
		lineTemp?.id,
		route?.id,
		line?.envelope,
		activateRoutingDrawerItem,
		dispatch,
		selectLine,
	]);

	const buttonStyle = useMemo(
		() => ({
			borderColor: theme.colors.onBackground,
			...((!route?.id || isRouting === route?.id) && {
				opacity: 0.5,
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
		<InfoRowControl
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
		</InfoRowControl>
	);
};

export default RowRouting;
