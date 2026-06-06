/**
 * External dependencies
 */
import React, { Dispatch, FC, Fragment, SetStateAction, useContext, useState } from 'react';
import { Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { createDocument } from 'react-native-scoped-storage';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import { useAppDispatch, useAppSelector } from '../../../../hooks';
import DrawerContext from '../../DrawerContext';
import { RoutingPoint, RoutingProfile, RoutingSegment } from '../../../routing/types';
import { handleSize, iconSize, itemStyles } from '../../constants';
import PointsList from '../../../routing/components/PointsList';
import EditPointModal from '../../../routing/components/EditPointModal';
import DismissProceedModal from '../../../routing/components/DismissProceedModal';
import { setIsRouting, setSavedExported } from '../../../routing/routingSlice';
import {
	selectIsRouting,
	selectPoints,
	selectSavedExported,
	selectSegments,
	selectStats,
} from '../../../routing/selectors';
import { createRoute } from '../../../routing/db/actionsRoute';

const DisplayComponent: FC<{
	scrollEnabled: boolean;
	setScrollEnabled: Dispatch<SetStateAction<boolean>>;
}> = ({ scrollEnabled, setScrollEnabled }) => {
	const { width, height, expand } = useContext(DrawerContext);

	const dispatch = useAppDispatch();

	const isRouting = useAppSelector(selectIsRouting);
	const points = useAppSelector(selectPoints);
	const segments = useAppSelector(selectSegments);
	const stats = useAppSelector(selectStats);
	const savedExported = useAppSelector(selectSavedExported);

	const { t } = useTranslation();

	const [dismissModalVisible, setDismissModalVisible] = useState(false);

	const [editPoint, setEditPoint] = useState<undefined | RoutingPoint>(undefined);

	return (
		<Fragment>
			{editPoint && (
				<EditPointModal
					editPoint={editPoint}
					setEditPoint={setEditPoint}
				/>
			)}

			{dismissModalVisible && (
				<DismissProceedModal
					dismissModalVisible={dismissModalVisible}
					setDismissModalVisible={setDismissModalVisible}
				/>
			)}

			<View style={itemStyles.item}>
				<ButtonHighlight
					style={itemStyles.buttonRow}
					mode="outlined"
					onPress={ async() => {
						if (isRouting) {
							if (
								points &&
								points.length &&
								Object.values(savedExported || {}).includes(false)
							) {
								setDismissModalVisible(true);
							} else {
								expand(false);
								dispatch(setIsRouting(false));
							}
						} else {
							const routeId = await createRoute();
							if ( routeId ) {
								dispatch(setIsRouting(routeId));
								expand(false);
							}
						}
					}}
				>
					<Text>{t(isRouting ? 'stopRouting???' : 'startRouting???')}</Text>
				</ButtonHighlight>

				{!isRouting && (
					<ButtonHighlight
						style={itemStyles.buttonRow}
						mode="outlined"
						onPress={() => null}
					>
						<Text>{t('load TODO???')}</Text>
					</ButtonHighlight>
				)}

				{isRouting && (
					<View
						style={[
							itemStyles.itemRow,
							{
								flexDirection: 'row',
								justifyContent: 'space-between',
								marginHorizontal: 20,
								marginTop: (handleSize - iconSize) / 2,
								// marginBottom: 16,
							},
						]}
					>
						<ButtonHighlight
							mode="outlined"
							onPress={() => null}
						>
							<Text>{t('save TODO???')}</Text>
						</ButtonHighlight>

						<ButtonHighlight
							mode="outlined"
							onPress={async () => {
								const allPositions =
									segments && segments?.length
										? [...segments]
												.map((segment) => {
													return segment?.positions;
												})
												.filter((segment) => !!segment)
												.flat()
										: [];

								const gpxString = [
									'<?xml version="1.0" encoding="UTF-8"?>',
									'<gpx',
									'  xmlns="http://www.topografix.com/GPX/1/1"',
									'  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
									'  xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd"',
									'  version="1.1" >',
									'  <trk>',
									'    <trkseg>',
									...[...allPositions].map(
										(pos) =>
											'      <trkpt lat="' +
											pos.lat +
											'" lon="' +
											pos.lng +
											'">' +
											(undefined !== pos?.alt
												? '<ele>' + pos?.alt + '</ele>'
												: '') +
											'</trkpt>'
									),
									'    </trkseg>',
									'  </trk>',
									'</gpx>',
								].join('\n');

								const fileName =
									[
										Math.round((stats?.distance || 0) / 1000) + 'km',
										Math.round(stats?.up || 0) + 'm_up',
										Math.round(stats?.down || 0) + 'm_down',
									].join('_') + '.gpx';

								const file = await createDocument(
									fileName,
									'application/gpx+xml',
									gpxString,
									'utf8'
								);

								if (file && setSavedExported) {
									dispatch(
										setSavedExported((savedExported) => ({
											...savedExported,
											exported: true,
										}))
									);
								}
							}}
						>
							<Text>{t('export???')}</Text>
						</ButtonHighlight>
					</View>
				)}

				{points && (
					<PointsList
						setScrollEnabled={setScrollEnabled}
						setEditPoint={setEditPoint}
					/>
				)}
			</View>
		</Fragment>
	);
};

export default DisplayComponent;
