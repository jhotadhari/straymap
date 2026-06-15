import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, useTheme } from 'react-native-paper';

import ModalWrapper from '../../../../components/generic/ModalWrapper';
import { useAppDispatch } from '../../../hooks';
import useRoute from '../../routing/hooks/useRoute';
import InfoRowControl from '../../../../components/generic/controls/InfoRowControl';
import { Line, LinePartial } from '../types';
import { useMutation, UseMutationOptions, useQuery } from '@tanstack/react-query';
import { queryLinesWithoutGeom } from '../db/queryFns';
import { updateLine } from '../db/actionsLine';
import { get } from 'lodash-es';

const LineEditModal: FC<{
	lineTemp?: LinePartial;
	setLineTemp: Dispatch<SetStateAction<LinePartial | undefined>>;
}> = ({ lineTemp, setLineTemp }) => {
	// const dispatch = useAppDispatch();

	// const segments = useAppSelector(selectSegmentsArr);

	const theme = useTheme();
	// const { t } = useTranslation();

	const { id: routeId } = useRoute(['id']) || {};

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
				if (routeId) {
					await context.client.cancelQueries({ queryKey: ['route', routeId] });
				}
			},
			onSuccess: async (_, _variables, _onMutateResult, context) => {
				await context.client.invalidateQueries({ queryKey: ['lines'] });
				if (routeId) {
					await context.client.invalidateQueries({ queryKey: ['route', routeId] });
				}
			},
		}),
		[routeId]
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
		</ModalWrapper>
	);
};

export default LineEditModal;
