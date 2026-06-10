/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';

/**
 * Internal dependencies
 */
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import { queryRoutingLineId } from '../../../routing/db/queries';
import { selectIsRouting } from '../../../routing/selectors';
import { queryLines } from '../../db/queries';
import { selectSelectedInfos } from '../../selectors';
import { LineWithTags } from '../../types';
import { styles } from './sharedDeps';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import Header from './Header';
import Footer from './Footer';

const LinesTable: FC = () => {
	const { t } = useTranslation();

	const dispatch = useAppDispatch();

	const theme = useTheme();

	const isRouting = useAppSelector(selectIsRouting);
	const { selectedIds: onMapIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const { data: lines } = useQuery({
		queryKey: ['lines'],
		queryFn: () => queryLines(),
	});

	const { data: routingLineId } = useQuery({
		queryKey: ['routingLineId', isRouting],
		queryFn: () => queryRoutingLineId(isRouting),
	});

	const [checkedIds, setCheckedIds] = useState<number[]>([]);

	const styleCell: StyleProp<ViewStyle> = useMemo(
		() => [
			styles.cell,
			{
				borderColor: theme.colors.surfaceVariant,
			},
		],
		[
			theme,
		]
	);

	const renderHeader = useCallback(() => {
		return <TableHeader styleCell={styleCell} />;
	}, [styleCell]);

	const renderItem: ListRenderItem<LineWithTags> = useCallback(
		({ item: line, index }) => {
			return (
				<TableRow
					styleCell={styleCell}
					line={line}
					idx={index}
					routingLineId={routingLineId}
					visible={visibleMap[line.id]}
					onMapIds={onMapIds}
					checkedIds={checkedIds}
					setCheckedIds={setCheckedIds}
				/>
			);
		},
		[
			routingLineId,
			visibleMap,
			onMapIds,
			checkedIds,
		]
	);

	return (
		<View style={styles.container}>
			<Header checkedIds={checkedIds} />

			<ScrollView horizontal={true}>
				<View style={{ flex: 1 }}>
					<FlatList
						stickyHeaderIndices={[0]}
						scrollEnabled={true}
						data={lines ?? []}
						keyExtractor={(line) => line.id.toString()}
						ListHeaderComponent={renderHeader}
						renderItem={renderItem}
					/>
				</View>
			</ScrollView>

			<Footer checkedIds={checkedIds} />
		</View>
	);
};

export default LinesTable;
