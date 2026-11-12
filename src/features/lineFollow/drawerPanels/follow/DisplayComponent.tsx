/**
 * External dependencies
 */
import React, { FC, useCallback, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { get } from 'lodash-es';

/**
 * Internal dependencies
 */
import { DRAWER_HANDLE_SIZE, DRAWER_ICON_SIZE, itemStyles } from '../../../drawers/constants';
import DrawerPanelHeading from '../../../drawers/components/DrawerPanelHeading';
import DrawerContext from '../../../drawers/DrawerContext';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { selectFollowingLineId } from '../../selectors';
import { stopFollowing } from '../../slice';
import { useFollowProgress } from '../../hooks/useFollowProgress';
import { queryLinesWithoutGeom } from '../../../lines/db/queryFns';
import { setLineTemp } from '../../../lines/slice';
import { selectUnitPrefs } from '../../../general/selectors';
import { formatDistance, formatHeightDepth } from '../../../../lib/formatting';
import { useButtonProps } from '../../../../compose/useButtonProps';
import ButtonHighlight from '../../../../components/generic/primitives/ButtonHighlight';
import IconCustom from '../../../../components/generic/primitives/IconCustom';

/**
 * A single label + right-aligned value row (muted label left, tabular
 * value right) — same visual language as the tracking panel's stat rows.
 */
const StatRow: FC<{ label: string; value: string }> = ({ label, value }) => (
	<View style={styles.statRow}>
		<Text style={styles.statLabel}>{label}</Text>
		<Text
			style={styles.statValue}
			numberOfLines={1}
		>
			{value}
		</Text>
	</View>
);

/**
 * Follow-route drawer panel: shows the followed line and the live
 * progress stats driven by the GNSS position.
 */
const DisplayComponent: FC = () => {
	const { height } = useContext(DrawerContext);
	const { t } = useTranslation();
	const dispatch = useAppDispatch();

	const followingLineId = useAppSelector(selectFollowingLineId);
	const isFollowing = followingLineId != null;

	const unitPrefs = useAppSelector(selectUnitPrefs);
	const progress = useFollowProgress(followingLineId);

	// The followed line may not be selected/on the map — fetch its title
	// straight from the DB (without geometry).
	const { data: lines } = useQuery({
		queryKey: ['lines', followingLineId != null ? [followingLineId] : []],
		queryFn: queryLinesWithoutGeom,
		enabled: isFollowing,
		gcTime: 1000 * 60 * 5,
	});
	const lineTitle = lines?.[0]?.title ?? null;

	const { nestedIconColor: detailsNestedIconColor, ...detailsButtonProps } = useButtonProps({});

	const style = useMemo(
		() => [
			itemStyles.item,
			{
				height: height - (DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE),
			},
		],
		[height]
	);

	const handleStopFollowing = useCallback(() => {
		dispatch(stopFollowing());
	}, [dispatch]);

	const handleEditLine = useCallback(() => {
		if (followingLineId == null) {
			return;
		}
		dispatch(setLineTemp({ id: followingLineId }));
	}, [dispatch, followingLineId]);

	const distUnit = get(unitPrefs, ['distance']);
	const heightUnit = get(unitPrefs, ['heightDepth']);

	// Same handle alignment as the lines panel's top bar: buttonRow
	// margins + a handle-height row, so the title/button row sits on the
	// second drawer handle below the heading.
	const styleRouteRow = useMemo(
		() => [
			itemStyles.buttonRow,
			styles.routeRow,
		],
		[]
	);

	return (
		<View style={style}>
			<View style={styles.headingWrap}>
				<DrawerPanelHeading
					title={t('lineFollow.title')}
					actionIcon={isFollowing ? 'close' : undefined}
					onActionPress={isFollowing ? handleStopFollowing : undefined}
					actionAccessibilityLabel={t('lineFollow.stop')}
					style={styles.heading}
				/>
			</View>

			{isFollowing ? (
				<>
					<View style={itemStyles.item}>
						<View style={styleRouteRow}>
							<Text
								style={styles.routeTitle}
								numberOfLines={2}
							>
								{lineTitle ?? ''}
							</Text>
							<ButtonHighlight
								{...detailsButtonProps}
								onPress={handleEditLine}
								icon={() => (
									<IconCustom
										name="route_cog"
										size={20}
										color={detailsNestedIconColor}
									/>
								)}
							>
								{t('lineFollow.editLine')}
							</ButtonHighlight>
						</View>
					</View>

					<View style={styles.content}>
						<View>
							<StatRow
								label={t('lineFollow.distanceToDestination')}
								value={
									progress
										? formatDistance(progress.distanceToDestination, distUnit)
										: '-'
								}
							/>
							<StatRow
								label={t('lineFollow.distanceCovered')}
								value={
									progress
										? formatDistance(progress.distanceCovered, distUnit)
										: '-'
								}
							/>
							<StatRow
								label={t('lineFollow.climbToDestination')}
								value={
									progress
										? formatHeightDepth(progress.climbToDestination, heightUnit)
										: '-'
								}
							/>
							<StatRow
								label={t('lineFollow.descentToDestination')}
								value={
									progress
										? formatHeightDepth(
												progress.descentToDestination,
												heightUnit
											)
										: '-'
								}
							/>
						</View>
					</View>
				</>
			) : (
				<View style={styles.content}>
					<Text style={styles.hintText}>{t('lineFollow.notFollowing')}</Text>
					<Text style={styles.hintText}>{t('lineFollow.notFollowingHint')}</Text>
				</View>
			)}
		</View>
	);
};

const styles = StyleSheet.create({
	headingWrap: {
		// Same negative offset the routing panel's headingWrap uses —
		// it puts the heading row exactly over the 50dp drawer handle box.
		top: -(DRAWER_HANDLE_SIZE - DRAWER_ICON_SIZE) / 6,
	},
	heading: {
		// Handle-height row: top and bottom edges flush with the drawer
		// handle box.
		height: DRAWER_HANDLE_SIZE,
		marginRight: 12,
		marginBottom: 10,
	},
	content: {
		paddingHorizontal: 16,
		paddingBottom: 16,
		gap: 24,
	},
	routeRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		height: DRAWER_HANDLE_SIZE,
	},
	routeTitle: {
		flex: 1,
		fontWeight: '600',
	},
	statRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	statLabel: {
		opacity: 0.6,
	},
	statValue: {
		// Always occupy the remaining row width so every value — short or
		// long — is flush against the same right edge.
		flex: 1,
		textAlign: 'right',
	},
	hintText: {
		opacity: 0.6,
	},
});

export default DisplayComponent;
