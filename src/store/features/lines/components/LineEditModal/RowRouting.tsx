/**
 * External dependencies
 */
import { FC, useCallback, useContext, useMemo } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { View } from 'react-native';

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
import { styles } from './sharedDeps';
import IconRouting from '../../../drawers/items/routing/IconComponent';

const RowRouting: FC = () => {
	const theme = useTheme();

	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const lineTemp = useAppSelector(selectLineTemp);

	const isRouting = useAppSelector(selectIsRouting);

	const { route, selectLine } = useContext(LineEditModalContext);

	const handlePress = useCallback(() => {
		if (lineTemp?.id && route?.id) {
			dispatch(setIsRouting(route.id));
			selectLine(lineTemp.id, true);
			activateRoutingDrawerItem();
		}
	}, [lineTemp?.id, route?.id]);

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
			>
				<View style={styles.buttonInner}>
					<IconRouting color={theme.colors.onBackground} />
					{!route?.id && <Text>{'no routing data???'}</Text>}
					{route?.id && isRouting !== route?.id && <Text>{'load routing???'}</Text>}
					{route?.id && isRouting === route?.id && <Text>{'is already routing???'}</Text>}
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowRouting;
