/**
 * External dependencies
 */
import { useQuery } from '@tanstack/react-query';
import { FC, useContext } from 'react';
import { ScrollView } from 'react-native-gesture-handler';

/**
 * Internal dependencies
 */
import { useAppSelector } from '../../../../hooks';
import { selectSelectedInfos } from '../../selectors';
import { queryLinesWithoutGeom } from '../../db/queryFns';
import ListRow from './ListRow';
import DrawerContext from '../../../drawers/DrawerContext';

const itemPaddingH = 16;
const SelectedLinesList: FC = () => {
	const { width } = useContext(DrawerContext);
	const { selectedIds, visibleMap } = useAppSelector(selectSelectedInfos);

	const { data: lines } = useQuery({
		queryKey: ['lines', selectedIds],
		queryFn: queryLinesWithoutGeom,
	});

	return (
		<ScrollView
			scrollEnabled={true}
			style={{
				width,
				paddingHorizontal: itemPaddingH,
			}}
		>
			{ lines?.map((line, idx) => (
		<ListRow
			key={line.id}
			line={line}
			idx={idx}
			visible={visibleMap[line.id]}
		/>
	)) }
		</ScrollView>
	);

};

export default SelectedLinesList;
