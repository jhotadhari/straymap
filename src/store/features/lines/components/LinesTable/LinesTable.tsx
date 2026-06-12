/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useCallback, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleProp, View, ViewStyle } from 'react-native';
import { useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../hooks';
import { queryLines } from '../../db/queries';
import { selectSelectedInfos } from '../../selectors';
import { LineWithTags } from '../../types';
import { styles } from './sharedDeps';
import TableHeader from './TableHeader';
import TableRow from './TableRow';
import Header from './Header';
import Footer from './Footer';

const LinesTable: FC = () => {

	const theme = useTheme();

	const { selectedIds: onMapIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const { data: lines } = useQuery({
		queryKey: ['lines'],
		queryFn: () => queryLines(),
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
					visible={visibleMap[line.id]}
					onMapIds={onMapIds}
					checkedIds={checkedIds}
					setCheckedIds={setCheckedIds}
				/>
			);
		},
		[
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
