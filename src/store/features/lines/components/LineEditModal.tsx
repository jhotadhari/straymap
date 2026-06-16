/**
 * External dependencies
 */
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { TextInput, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch } from '../../../hooks';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { LinePartial } from '../types';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { updateLine } from '../db/actionsLine';
import { get } from 'lodash-es';
import ButtonHighlight from '../../../../components/generic/ButtonHighlight';
import IconRouting from '../../drawers/items/routing/IconComponent';
import { setIsRouting } from '../../routing/slice';
import { queryRouteForLine } from '../../routing/db/queryFns';
import useActivateDrawerItem from '../../drawers/hooks/useActivateDrawerItem';

const LineEditModal: FC<{
	lineTemp?: LinePartial;
	setLineTemp: Dispatch<SetStateAction<LinePartial | undefined>>;
}> = ({ lineTemp, setLineTemp }) => {
	const dispatch = useAppDispatch();

	const activateRoutingDrawerItem = useActivateDrawerItem('routing');

	const theme = useTheme();

	const { data: route } = useQuery({
		queryKey: ['routeForLine', lineTemp?.id],
		queryFn: queryRouteForLine,
	});

	const { data: line } = useQuery({
		queryKey: ['lines', lineTemp?.id ? [lineTemp?.id] : []],
		queryFn: queryLinesWithoutGeom,
		select: (lines: LinePartial[]) => (lines.length ? lines[0] : null),
	});

	const mutationOptions: UseMutationOptions<void, Error, LinePartial, unknown> = useMemo(
		() => ({
			mutationFn: (newLinePartial: LinePartial) =>
				updateLine(newLinePartial?.id, newLinePartial),
			onMutate: async (_, context) => {
				await context.client.cancelQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await context.client.cancelQueries({ queryKey: ['route', route?.id] });
				}
			},
			onSuccess: async (_, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['lines'] });
				if (route?.id) {
					await context.client.invalidateQueries({ queryKey: ['route', route?.id] });
				}
			},
		}),
		[route?.id]
	);
	const mutation = useMutation(mutationOptions);

	const onDismiss = useCallback(() => {
		if (
			line &&
			lineTemp &&
			Object.keys(lineTemp).some((key: string) => get(line, key) !== get(lineTemp, key))
		) {
			mutation.mutate(lineTemp);
		}
		setLineTemp(undefined);
	}, [
		mutation.mutate,
		line,
		lineTemp,
	]);

	return (
		<ModalWrapper
			visible={!!lineTemp}
			onDismiss={onDismiss}
			header={'bla???'}
		>
			<InfoRowControl
				label={'name'}
				// Info={Info}
			>
				<TextInput
					style={{ flexGrow: 1 }}
					underlineColor="transparent"
					dense={true}
					theme={{
						fonts: {
							bodyLarge: {
								...theme.fonts.bodySmall,
								fontFamily: 'sans-serif',
							},
						},
					}}
					onChangeText={(newVal) =>
						lineTemp
							? setLineTemp((lineTemp) => ({
									...(lineTemp as LinePartial),
									title: newVal,
								}))
							: undefined
					}
					value={lineTemp?.title ?? line?.title ?? ''}
				/>
			</InfoRowControl>
			{ route?.id && <ButtonHighlight
				// style={styles.noShrink}
				mode="text"
				compact={true}
				onPress={() => {
					if (route?.id) {
						dispatch(setIsRouting(route.id));
						activateRoutingDrawerItem();
					}
					onDismiss();
				}}
			>
				<IconRouting color={theme.colors.primary} />
			</ButtonHighlight> }
		</ModalWrapper>
	);
};

export default LineEditModal;
