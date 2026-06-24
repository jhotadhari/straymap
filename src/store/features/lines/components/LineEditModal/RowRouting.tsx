/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { TextStyle, View } from 'react-native';
import { MapContainerModule } from 'react-native-mapsforge-vtm';
import { centerOfMass } from '@turf/turf';

/**
 * Internal dependencies
 */
import { LineEditModalContext } from './Context';
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { selectLineTemp } from '../../selectors';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { selectIsRouting } from '../../../routing/selectors';
import { setIsRouting } from '../../../routing/slice';
import useActivateDrawerItem from '../../../drawers/hooks/useActivateDrawerItem';
import { sharedStyles } from './sharedDeps';
import IconRouting from '../../../drawers/items/routing/IconComponent';
import { AppContext } from '../../../../../Context';

const renderIconRouting = ({ color }: { color: TextStyle['color'] }) => (
	<IconRouting color={color} />
);

const RowRouting: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const lineTemp = useAppSelector(selectLineTemp);

	const isRouting = useAppSelector(selectIsRouting);

	const { mapViewNativeNodeHandle } = useContext(AppContext);

	const { route, selectLine, line } = useContext(LineEditModalContext);

	const handlePress = useCallback(() => {
		if (lineTemp?.id && route?.id) {
			// set bounds. ??? have to implement set bounds. use center for now,
			if (line?.envelope) {
				const centerPoint = centerOfMass(line?.envelope);
				MapContainerModule.setCenter(mapViewNativeNodeHandle, {
					lng: centerPoint.geometry.coordinates[0],
					lat: centerPoint.geometry.coordinates[1],
				});
			}
			dispatch(setIsRouting(route.id));
			selectLine(lineTemp.id, true);
			activateRoutingDrawerItem();
		}
	}, [
		mapViewNativeNodeHandle,
		lineTemp?.id,
		route?.id,
		line?.envelope,
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
			label={'routing???'}
			// Info={Info}
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
					{!route?.id && <Text>{'no routing data???'}</Text>}
					{route?.id && isRouting !== route?.id && <Text>{'load routing???'}</Text>}
					{route?.id && isRouting === route?.id && <Text>{'is already routing???'}</Text>}
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowRouting;
