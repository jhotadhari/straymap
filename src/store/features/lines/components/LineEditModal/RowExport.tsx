/**
 * External dependencies
 */
import { FC, useCallback } from 'react';
import { Icon, Text, useTheme } from 'react-native-paper';
import { View } from 'react-native';

/**
 * Internal dependencies
 */
import InfoRowControl from '../../../../../components/generic/controls/InfoRowControl';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { styles } from './sharedDeps';
import { iconSize } from '../../../drawers/constants';

const RowExport: FC = () => {
	const theme = useTheme();

	// const dispatch = useAppDispatch();

	// const lineTemp = useAppSelector(selectLineTemp);

	// const isRouting = useAppSelector(selectIsRouting);

	// const { route } = useContext(LineEditModalContext);

	const handlePress = useCallback(() => {
		// const allPositions =
		// 	segments && segments?.length
		// 		? [...segments]
		// 				.map((segment) => {
		// 					return segment?.positions;
		// 				})
		// 				.filter((segment) => !!segment)
		// 				.flat()
		// 		: [];
		// const stats =
		// 	allPositions.length > 1
		// 		? await lineStringToStats(
		// 				lineString(locationsToCoordsArr(allPositions))
		// 					.geometry
		// 			)
		// 		: {};
		// const gpxString = [
		// 	'<?xml version="1.0" encoding="UTF-8"?>',
		// 	'<gpx',
		// 	'  xmlns="http://www.topografix.com/GPX/1/1"',
		// 	'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
		// 	'  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"',
		// 	'  version="1.1" >',
		// 	'  <trk>',
		// 	'    <trkseg>',
		// 	...[...allPositions].map(
		// 		(pos) =>
		// 			'      <trkpt lat="' +
		// 			pos.lat +
		// 			'" lon="' +
		// 			pos.lng +
		// 			'">' +
		// 			(undefined !== pos?.alt
		// 				? '<ele>' + pos?.alt + '</ele>'
		// 				: '') +
		// 			'</trkpt>'
		// 	),
		// 	'    </trkseg>',
		// 	'  </trk>',
		// 	'</gpx>',
		// ].join('\n');
		// const fileName =
		// 	[
		// 		Math.round((stats?.length || 0) / 1000) + 'km',
		// 		Math.round(stats?.uphill || 0) + 'm_up',
		// 		Math.round(stats?.downhill || 0) + 'm_down',
		// 	].join('_') + '.gpx';
		// await createDocument(
		// 	fileName,
		// 	'application/gpx+xml',
		// 	gpxString,
		// 	'utf8'
		// );
	}, []);

	return (
		<InfoRowControl
			label={'export???'}
			// Info={Info}
		>
			<ButtonHighlight
				mode="outlined"
				compact={true}
				onPress={handlePress}
			>
				<View style={styles.buttonInner}>
					<Icon
						source="content-save-outline"
						size={iconSize}
					/>
					<Text>{'??? TODO export '}</Text>
				</View>
			</ButtonHighlight>
		</InfoRowControl>
	);
};

export default RowExport;
