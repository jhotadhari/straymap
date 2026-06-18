/**
 * External dependencies
 */
import { FC, useMemo } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Text, useTheme } from 'react-native-paper';

/**
 * Internal dependencies
 */
import { sharedStyles, lineCells, statsCells, otherCells } from './sharedDeps';

const TableHeader: FC<{
	styleCell: StyleProp<ViewStyle>;
}> = ({ styleCell }) => {
	const theme = useTheme();

	const style: StyleProp<ViewStyle> = useMemo(
		() => [
			styleCell,
			{
				height: 50,
			},
		],
		[styleCell]
	);

	const styleContainer: StyleProp<ViewStyle> = useMemo(
		() => [
			sharedStyles.flexRow,
			{
				backgroundColor: theme.colors.background,
				borderBottomWidth: 1,
				borderColor: theme.colors.onBackground,
			},
		],
		[theme]
	);

	return (
		<View style={styleContainer}>
			<View style={style} />

			{Object.keys(lineCells).map((key) => {
				return (
					<View
						key={key}
						style={lineCells[key]?.style ? [style, lineCells[key]?.style] : style}
					>
						<Text>{key}</Text>
					</View>
				);
			})}

			{Object.keys(otherCells).map((key) => {
				return (
					<View
						key={key}
						style={
							otherCells[key]?.style ? [styleCell, otherCells[key]?.style] : styleCell
						}
					>
						<Text>{key}</Text>
					</View>
				);
			})}

			{Object.keys(statsCells).map((key) => {
				return (
					<View
						key={key}
						style={
							statsCells[key]?.style ? [styleCell, statsCells[key]?.style] : styleCell
						}
					>
						<Text>{key}</Text>
					</View>
				);
			})}
		</View>
	);
};

export default TableHeader;
