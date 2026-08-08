/**
 * External dependencies
 */
import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ColorValue, StyleSheet, View } from 'react-native';
import { Icon, Text, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, UseMutationOptions } from '@tanstack/react-query';
import { lineString } from '@turf/turf';
import { enrichCoordinatesWithElevation } from 'react-native-mapsforge-vtm';
import { LineString } from 'geojson';
import LucideIcons from '@react-native-vector-icons/lucide/static';
import { findKey, get } from 'lodash-es';

/**
 * Internal dependencies
 */
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../components/generic/wrapper/RadioListItem';
import { sharedStyles } from '../../../sharedStyles';
import { POPOVER_MENU_ITEM_ICON_SIZE } from '../../../constants';
import { altitudeService } from '../../../lib/AltitudeService';
import { logError } from '../../../lib/utils';
import { updateLine } from '../db/actionsLine';
import { fetchLines } from '../db/fetch';
import {
	cancelLinesQueries,
	cancelLineGeomQueries,
	invalidateLinesQueries,
	invalidateLineGeomQueries,
} from '../db/queryFns';
import { dbConnection } from '../../dbLoader/DBConnection';
import { useSystemLineIds } from '../../../store/hooks';
import { OptionBase } from '../../../types';
import { LinePartial } from '../types';
import { useButtonProps } from '../../../compose/useButtonProps';

const DEM_OPTION_MISSING = 'missing';
const DEM_OPTION_OVERWRITE = 'overwrite';
const DEM_OPTION_OVERWRITE_ALL = 'overwriteAll';

const ApplyDemIconComponent: FC<{ color?: ColorValue; size?: number }> = ({ color, size }) => {
	size = (size ?? POPOVER_MENU_ITEM_ICON_SIZE) - 2;
	return (
		<LucideIcons
			color={color ?? ''}
			size={size}
			name="mountain"
			style={styles.iconFix}
		/>
	);
};

type LineEnrichStats = {
	coordsCount: number;
	enrichedCount: number;
	alreadyHadZCount: number;
	missingHgtCount: number;
	errorMsg?: string;
};

const demOptions: OptionBase[] = [
	{ key: DEM_OPTION_MISSING, label: 'lines.applyDemOptionMissing' },
	{ key: DEM_OPTION_OVERWRITE, label: 'lines.applyDemOptionOverwrite' },
	{ key: DEM_OPTION_OVERWRITE_ALL, label: 'lines.applyDemOptionOverwriteAll' },
];

const useApplyDemCbModal = ({
	lineIdsOrId,
	backgroundBlur,
}: {
	lineIdsOrId?: number | number[];
	backgroundBlur?: boolean;
}) => {
	const { t } = useTranslation();

	const lineIds = useMemo(
		() =>
			Array.isArray(lineIdsOrId)
				? lineIdsOrId
				: lineIdsOrId !== undefined && lineIdsOrId !== null
					? [lineIdsOrId]
					: [],
		[lineIdsOrId]
	);

	const systemLineIds = useSystemLineIds();
	const systemLineIdSet = useMemo(() => new Set(Object.values(systemLineIds)), [systemLineIds]);

	const processableLineIds = useMemo(
		() => lineIds.filter((id) => !systemLineIdSet.has(id)),
		[lineIds, systemLineIdSet]
	);
	const theme = useTheme();

	const [processingStarted, setProcessingStarted] = useState(false);
	const [modalVisible, setModalVisible] = useState(false);
	const [selectedOption, setSelectedOption] = useState<string | null>(null);

	const [processedLineIds, setProcessedLineIds] = useState<number[]>([]);
	const [currentLineId, setCurrentLineId] = useState<number | null>(null);
	const [currentLineProgress, setCurrentLineProgress] = useState<number | null>(null);
	const [failedLineIds, setFailedLineIds] = useState<number[]>([]);
	const [lineStats, setLineStats] = useState<Record<number, LineEnrichStats>>({});
	const [lineMeta, setLineMeta] = useState<
		Record<number, { title: string | null; custom_date: string | null }>
	>({});

	const cb = useCallback(() => {
		setModalVisible(true);
	}, []);

	const isPendingRef = useRef(false);

	const handleDismissModal = useCallback(() => {
		if (isPendingRef.current) {
			return;
		}
		setModalVisible(false);
		setProcessingStarted(false);
		setProcessedLineIds([]);
		setCurrentLineId(null);
		setCurrentLineProgress(null);
		setFailedLineIds([]);
		setLineStats({});
		setLineMeta({});
		setSelectedOption(null);
	}, []);

	const mutationOptions: UseMutationOptions<
		void,
		Error,
		{ lineIds: number[]; option: string },
		void
	> = useMemo(
		() => ({
			mutationFn: ({ lineIds, option }) => {
				return new Promise<void>((resolveOuter, rejectOuter) => {
					setProcessedLineIds([]);
					setCurrentLineId(null);
					setCurrentLineProgress(null);
					setFailedLineIds([]);
					setLineStats({});
					const api = altitudeService.requireHandle();
					lineIds
						.reduce(
							(chain, lineId) =>
								chain.then(
									() =>
										new Promise<void>((resolve) => {
											setCurrentLineId(lineId);
											setCurrentLineProgress(null);
											let finishStats: LineEnrichStats | undefined;
											const finishLine = () => {
												setProcessedLineIds((prev) => [...prev, lineId]);
												setCurrentLineProgress(1);
												const stats = finishStats;
												if (stats) {
													setLineStats((prev) => ({
														...prev,
														[lineId]: stats,
													}));
												}
												resolve();
											};
											fetchLines({
												lineIds: [lineId],
												fieldsInclude: ['geometry'],
											})
												.then((lines) => {
													const line = lines[0] as
														| (LinePartial & { geometry: LineString })
														| undefined;
													if (!line?.geometry?.coordinates?.length) {
														finishLine();
														return;
													}

													// Deep-clone so enrichCoordinatesWithElevation
													// doesn't mutate the DB-cached reference.
													const clonedCoords: number[][] =
														line.geometry.coordinates.map(
															(c: number[]) =>
																[
																	c[0],
																	c[1],
																	c[2] ?? 0,
																] as number[]
														);

													switch (option) {
														case DEM_OPTION_MISSING: {
															const zeroIndices: number[] = [];
															const zeroCoords: number[][] = [];
															clonedCoords.forEach((c, i) => {
																if (c[2] === 0) {
																	zeroIndices.push(i);
																	zeroCoords.push(c);
																}
															});
															const _coordsCount =
																clonedCoords.length;
															const _alreadyHadZCount =
																_coordsCount - zeroCoords.length;
															if (zeroCoords.length > 0) {
																enrichCoordinatesWithElevation(
																	zeroCoords,
																	api,
																	{
																		onProgress:
																			setCurrentLineProgress,
																	}
																).then(() => {
																	zeroIndices.forEach(
																		(originalIdx, j) => {
																			clonedCoords[
																				originalIdx
																			][2] = zeroCoords[j][2];
																		}
																	);
																	const _stillZero =
																		zeroCoords.filter(
																			(c) => c[2] === 0
																		).length;
																	finishStats = {
																		coordsCount: _coordsCount,
																		enrichedCount:
																			zeroCoords.length -
																			_stillZero,
																		alreadyHadZCount:
																			_alreadyHadZCount,
																		missingHgtCount: _stillZero,
																	};
																	updateLine(lineId, {
																		lineStringFeature:
																			lineString(
																				clonedCoords
																			),
																	}).then(() => finishLine());
																});
															} else {
																finishLine();
															}
															break;
														}
														case DEM_OPTION_OVERWRITE: {
															const originalZ = clonedCoords.map(
																(c) => c[2]
															);
															const _coordsCount =
																clonedCoords.length;
															const _zeroBeforeCount =
																clonedCoords.filter(
																	(c) => c[2] === 0
																).length;
															const _alreadyHadZCount =
																_coordsCount - _zeroBeforeCount;
															enrichCoordinatesWithElevation(
																clonedCoords,
																api,
																{
																	onProgress:
																		setCurrentLineProgress,
																}
															).then(() => {
																clonedCoords.forEach((c, i) => {
																	if (
																		c[2] === 0 &&
																		originalZ[i] !== 0
																	) {
																		c[2] = originalZ[i];
																	}
																});
																const _stillZero =
																	clonedCoords.filter(
																		(c) => c[2] === 0
																	).length;
																finishStats = {
																	coordsCount: _coordsCount,
																	enrichedCount:
																		_zeroBeforeCount -
																		_stillZero,
																	alreadyHadZCount:
																		_alreadyHadZCount,
																	missingHgtCount: _stillZero,
																};
																updateLine(lineId, {
																	lineStringFeature:
																		lineString(clonedCoords),
																}).then(() => finishLine());
															});
															break;
														}
														case DEM_OPTION_OVERWRITE_ALL:
														default: {
															const _coordsCount =
																clonedCoords.length;
															const _zeroBeforeCount =
																clonedCoords.filter(
																	(c) => c[2] === 0
																).length;
															const _alreadyHadZCount =
																_coordsCount - _zeroBeforeCount;
															enrichCoordinatesWithElevation(
																clonedCoords,
																api,
																{
																	onProgress:
																		setCurrentLineProgress,
																}
															).then(() => {
																const _stillZero =
																	clonedCoords.filter(
																		(c) => c[2] === 0
																	).length;
																finishStats = {
																	coordsCount: _coordsCount,
																	enrichedCount:
																		_zeroBeforeCount -
																		_stillZero,
																	alreadyHadZCount:
																		_alreadyHadZCount,
																	missingHgtCount: _stillZero,
																};
																updateLine(lineId, {
																	lineStringFeature:
																		lineString(clonedCoords),
																}).then(() => finishLine());
															});
															break;
														}
													}
												})
												.catch((e) => {
													logError(
														'useApplyDemCbModal.mutationFn.perLine',
														e
													);
													setFailedLineIds((prev) => [...prev, lineId]);
													finishStats = {
														coordsCount: 0,
														enrichedCount: 0,
														alreadyHadZCount: 0,
														missingHgtCount: 0,
														errorMsg:
															e instanceof Error
																? e.message
																: String(e),
													};
													finishLine();
												});
										})
								),
							Promise.resolve()
						)
						.then(() => {
							setCurrentLineId(null);
							resolveOuter();
						})
						.catch((e) => rejectOuter(e));
				});
			},
			onMutate: async () => {
				await cancelLinesQueries(dbConnection.queryClient!);
				await cancelLineGeomQueries(dbConnection.queryClient!);
			},
			onSuccess: async () => {
				await invalidateLinesQueries(dbConnection.queryClient!);
				await invalidateLineGeomQueries(dbConnection.queryClient!);
				isPendingRef.current = false;
			},
		}),
		[]
	);

	const mutation = useMutation(mutationOptions);

	useEffect(() => {
		isPendingRef.current = mutation.isPending;
	}, [mutation.isPending]);

	const handleApplyDem = useCallback(async () => {
		if (!selectedOption) {
			return;
		}

		setProcessingStarted(true);

		// Pre-fetch line metadata for the progress list before
		// the mutation starts so labels are available immediately.
		try {
			const metaLines = await fetchLines({
				lineIds,
				fieldsInclude: ['title', 'custom_date'],
			});
			const meta: Record<number, { title: string | null; custom_date: string | null }> = {};
			metaLines.forEach((l) => {
				meta[l.id] = {
					title: l.title ?? null,
					custom_date: l.custom_date ?? null,
				};
			});
			setLineMeta(meta);
		} catch {
			// Metadata fetch is non-critical — continue even if it fails.
		}

		mutation.mutate({ lineIds: processableLineIds, option: selectedOption });
	}, [
		lineIds,
		selectedOption,
		mutation,
		processableLineIds,
	]);

	const disabled = useMemo(
		() => selectedOption === null || processingStarted,
		[selectedOption, processingStarted]
	);

	const buttonProps = useButtonProps({
		disabled,
	});

	const modalNode = useMemo(() => {
		if (!modalVisible) {
			return undefined;
		}

		return (
			<ModalWrapper
				visible={modalVisible}
				backgroundBlur={backgroundBlur}
				onDismiss={handleDismissModal}
				dismissDisabled={mutation.isPending}
				headerLabel={t('lines.applyDem')}
				innerStyle={sharedStyles.modal}
			>
				<Text>{t('lines.applyDemDescription')}</Text>

				<View>
					{demOptions.map(
						(opt) =>
							(!processingStarted || selectedOption === opt.key) && (
								<RadioListItem
									key={opt.key}
									opt={opt}
									labelExtractor={(o) => t(o.label)}
									status={selectedOption === opt.key ? 'checked' : 'unchecked'}
									onPress={() => setSelectedOption(opt.key)}
									disabled={processingStarted}
								/>
							)
					)}
				</View>

				{!processingStarted && (
					<View style={styles.controlsContainer}>
						<ButtonHighlight
							{...buttonProps}
							onPress={handleApplyDem}
							// mode="outlined"
							// disabled={disabled}
						>
							{mutation.isPending
								? t('lines.applyDemApplying')
								: t('lines.applyDemApply')}
						</ButtonHighlight>
					</View>
				)}

				{processingStarted &&
					lineIds.map((id) => (
						<View
							key={id}
							style={styles.lineRow}
						>
							{systemLineIdSet.has(id) ? (
								<Icon
									source="lock-outline"
									size={20}
								/>
							) : failedLineIds.includes(id) ? (
								<LucideIcons
									size={20}
									color={theme.colors.error}
									name="triangle-alert"
								/>
							) : processedLineIds.includes(id) ? (
								<Icon
									source="check"
									size={20}
									color={theme.colors.primary}
								/>
							) : currentLineId === id ? (
								<LoadingIndicator
									size="small"
									style={styles.lineIcon}
								/>
							) : (
								<Icon
									source="dots-horizontal"
									size={20}
								/>
							)}
							<View style={styles.lineLabel}>
								{!!lineMeta[id]?.title && <Text>{lineMeta[id]?.title}</Text>}
								{lineMeta[id]?.custom_date && (
									<Text variant={lineMeta[id]?.title ? 'bodySmall' : undefined}>
										{lineMeta[id].custom_date}
									</Text>
								)}
								{currentLineId === id && currentLineProgress !== null && (
									<View style={styles.progressTrack}>
										<View
											style={[
												styles.progressFill,
												{
													width: `${Math.round(currentLineProgress * 100)}%` as any,
													backgroundColor: theme.colors.primary,
												},
											]}
										/>
									</View>
								)}
								{systemLineIdSet.has(id) && (
									<View style={styles.statsRow}>
										<Text variant="bodySmall">
											{t(
												get(
													{
														['routing']: 'lines.lineBusy.routing',
														['trackRecording']:
															'lines.lineBusy.trackRecording',
													},
													findKey(systemLineIds, (o) => o === id) ?? '',
													'lines.lineBusy.any'
												)
											)}
										</Text>
									</View>
								)}
								{lineStats[id] && (
									<View style={styles.statsRow}>
										{lineStats[id]!.errorMsg ? (
											<Text
												variant="bodySmall"
												style={{ color: theme.colors.error }}
											>
												{lineStats[id]!.errorMsg}
											</Text>
										) : (
											<Text variant="bodySmall">
												{t('lines.applyDemStats', {
													coordsCount: lineStats[id]!.coordsCount,
													enrichedCount: lineStats[id]!.enrichedCount,
													alreadyHadZCount:
														lineStats[id]!.alreadyHadZCount,
													missingHgtCount: lineStats[id]!.missingHgtCount,
												})}
											</Text>
										)}
									</View>
								)}
							</View>
						</View>
					))}
			</ModalWrapper>
		);
	}, [
		t,
		modalVisible,
		handleDismissModal,
		handleApplyDem,
		backgroundBlur,
		selectedOption,
		mutation.isPending,
		buttonProps,
		lineIds,
		processingStarted,
		currentLineId,
		processedLineIds,
		lineMeta,
		currentLineProgress,
		systemLineIdSet,
		failedLineIds,
		lineStats,
		theme,
		systemLineIds,
	]);

	return useMemo(
		() => ({
			cb,
			modalNode,
			IconComponent: ApplyDemIconComponent,
		}),
		[cb, modalNode]
	);
};

const styles = StyleSheet.create({
	lineRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		paddingVertical: 4,
	},
	lineIcon: {
		width: 20,
		height: 20,
	},
	lineLabel: {
		flex: 1,
	},
	progressTrack: {
		height: 4,
		borderRadius: 2,
		marginTop: 4,
		overflow: 'hidden',
	},
	progressFill: {
		height: '100%',
		borderRadius: 2,
	},
	controlsContainer: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		alignItems: 'center',
	},
	iconFix: {
		marginLeft: 2,
	},
	statsRow: {
		marginTop: 2,
	},
});

export default useApplyDemCbModal;
