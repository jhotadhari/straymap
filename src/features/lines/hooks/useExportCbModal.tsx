/**
 * External dependencies
 */
import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Text, Icon, useTheme } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { sprintf } from 'sprintf-js';
import { writeFile, ExternalStorageDirectoryPath } from 'react-native-fs';
import { chunk, get } from 'lodash-es';
import { LineString } from 'geojson';
import { useQuery } from '@tanstack/react-query';

/**
 * Internal dependencies
 */
import dayjs from '../../../lib/dayjs';
import { logError } from '../../../lib/utils';
import ensureStoragePermission from '../../../lib/storagePermission';
import ButtonHighlight from '../../../components/generic/primitives/ButtonHighlight';
import ModalWrapper from '../../../components/generic/wrapper/ModalWrapper';
import RadioListItem from '../../../components/generic/wrapper/RadioListItem';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import { useButtonProps } from '../../../compose/useButtonProps';
import { useAppSelector } from '../../../store/hooks';
import { selectAppDirs } from '../../dirs/selectors';
import { AbsPath } from '../../dirs/types';
import { fetchLines } from '../db/fetch';
import { queryLineGeom } from '../db/queryFns';
import { queryLinePointsByLineId, queryLinePointsByLineIds } from '../db/linePointsQueryFns';
import useBackgroundTask from '../../../hooks/useBackgroundTask';
import {
	alignPointsToCoords,
	writeFormat,
	EXPORT_FORMATS,
	ExportFormat,
} from '../utils/formatWriters';
import {
	queryTrackPointsByLineId,
	queryTrackPointsByLineIds,
} from '../../trackRecording/db/queryFns';
import { resolveFilename, sanitizeFilename, DEFAULT_TEMPLATE } from '../utils/filenameTemplate';
import { LinePartial } from '../types';

// Legacy fallback for devices where the dirs feature hasn't resolved yet.
const LEGACY_EXPORT_DIR =
	ExternalStorageDirectoryPath + '/Android/media/com.jhotadhari.straymap/export';

const extractLabel = (a: { label: string }) => a.label;

const formatOptions = EXPORT_FORMATS.map((f) => ({ key: f.key, label: f.label }));

type ExportPhase = 'format' | 'progress' | 'result';

interface PrepTask {
	filename: string;
	buildContent: () => string;
}

interface ExportResult {
	icon: string;
	header: string;
	details: string[];
}

const styles = StyleSheet.create({
	controlsRow: {
		marginTop: 16,
		flexDirection: 'row',
		gap: 8,
		justifyContent: 'flex-end',
	},
	controlsRowBetween: {
		marginTop: 16,
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		marginTop: 16,
	},
	progressText: {
		flexShrink: 1,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
		marginTop: 16,
	},
	resultIcon: {
		marginTop: 2,
	},
	resultContent: {
		flex: 1,
		gap: 8,
	},
	detailText: {
		color: undefined as string | undefined,
	},
});

type UseExportCbModalParams =
	| { type: 'single'; line: LinePartial | null | undefined }
	| { type: 'bulk'; checkedIds: number[] };

const useExportCbModal = (params: UseExportCbModalParams) => {
	const { t } = useTranslation();
	const theme = useTheme();

	const appDirs = useAppSelector(selectAppDirs);
	const exportDir = useMemo(
		() => (get(appDirs, 'export', []) as AbsPath[])[0] ?? LEGACY_EXPORT_DIR,
		[appDirs]
	);

	const [modalVisible, setModalVisible] = useState(false);
	const [phase, setPhase] = useState<ExportPhase>('format');
	const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('gpx');
	const [progressCount, setProgressCount] = useState(0);
	const [totalCount, setTotalCount] = useState(0);
	const [result, setResult] = useState<ExportResult | null>(null);
	const stoppedRef = useRef(false);

	const lineId = params.type === 'single' ? params.line?.id : undefined;
	const queryKey = useMemo(() => ['lineGeom', lineId] as (string | number)[], [lineId]);
	const { data: lineWithGeom, isLoading: geomLoading } = useQuery({
		queryKey,
		queryFn: queryLineGeom,
		enabled: typeof lineId === 'number' && modalVisible && params.type === 'single',
	});

	// Per-point metadata (timestamps etc.) for recorded lines — feeds
	// GPX <time> / GeoJSON coordTimes.  Empty for non-recorded lines.
	const { data: singleTrackPoints } = useQuery({
		queryKey: ['lineTrackPoints', lineId],
		queryFn: () => queryTrackPointsByLineId(lineId as number),
		enabled: typeof lineId === 'number' && modalVisible && params.type === 'single',
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	// Same for imported lines (line_points) — a line has recording
	// metadata XOR imported metadata, never both.
	const { data: singleLinePoints } = useQuery({
		queryKey: ['linePoints', lineId],
		queryFn: () => queryLinePointsByLineId(lineId as number),
		enabled: typeof lineId === 'number' && modalVisible && params.type === 'single',
		staleTime: Infinity,
		gcTime: 1000 * 10,
	});

	// Bulk export keep-alive: registers a task in the shared
	// BackgroundTaskService (wake lock keeps the CPU alive through
	// Doze), so a backgrounded bulk export completes.  Errors are
	// swallowed by the hook — the export never depends on it.
	const bgTask = useBackgroundTask(t('lines.exportingBackground'));

	const detailStyle = useMemo(
		() => [styles.detailText, { color: theme.colors.onSurfaceVariant }],
		[theme.colors.onSurfaceVariant]
	);

	const cb = useCallback(() => {
		setPhase('format');
		setResult(null);
		setProgressCount(0);
		setTotalCount(0);
		stoppedRef.current = false;
		setModalVisible(true);
	}, []);

	const handleDismiss = useCallback(() => {
		if (phase !== 'progress') {
			setModalVisible(false);
		}
	}, [phase]);

	const handleStop = useCallback(() => {
		stoppedRef.current = true;
	}, []);

	const handleExportSingle = useCallback(async () => {
		const line = params.type === 'single' ? params.line : undefined;
		if (!lineWithGeom?.geometry) {
			setResult({
				icon: 'close-circle-outline',
				header: t('lines.exportNoGeom'),
				details: [],
			});
			setPhase('result');
			return;
		}

		setPhase('progress');

		const hasPermission = await ensureStoragePermission();
		if (!hasPermission) {
			setResult({
				icon: 'close-circle-outline',
				header: t('lines.exportPermissionDenied'),
				details: [],
			});
			setPhase('result');
			return;
		}

		try {
			const safeTitle = line?.title ?? line?.id?.toString() ?? 'line';
			const rawDate = line?.custom_date ?? line?.created_at ?? null;
			const dateStr = rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : 'no-date';
			const ext = selectedFormat === 'geojson' ? 'geojson' : selectedFormat;

			const resolved = resolveFilename(DEFAULT_TEMPLATE, {
				title: safeTitle,
				id: line?.id,
				custom_date: dateStr,
			});
			const filename = `${sanitizeFilename(resolved)}.${ext}`;

			const content = writeFormat(selectedFormat, [
				{
					geometry: lineWithGeom.geometry,
					meta: { title: line?.title, custom_date: rawDate },
					points: alignPointsToCoords(
						lineWithGeom.geometry.coordinates,
						singleTrackPoints?.length ? singleTrackPoints : singleLinePoints
					),
				},
			]);

			const filepath = `${exportDir}/${filename}`;
			await writeFile(filepath, content, 'utf8');

			setResult({
				icon: 'check-circle-outline',
				header: filepath,
				details: [],
			});
		} catch (e) {
			logError('useExportCbModal.single', e);
			setResult({
				icon: 'close-circle-outline',
				header: t('errorGeneric'),
				details: [],
			});
		} finally {
			setPhase('result');
		}
	}, [
		params,
		lineWithGeom,
		singleTrackPoints,
		singleLinePoints,
		selectedFormat,
		exportDir,
		t,
	]);

	const handleExportBulk = useCallback(async () => {
		const checkedIds = params.type === 'bulk' ? params.checkedIds : [];
		if (!checkedIds.length) {
			return;
		}

		setPhase('progress');
		setProgressCount(0);

		const hasPermission = await ensureStoragePermission();
		if (!hasPermission) {
			setResult({
				icon: 'close-circle-outline',
				header: t('lines.exportPermissionDenied'),
				details: [],
			});
			setPhase('result');
			return;
		}

		let written = 0;
		const failed: string[] = [];
		let total = 0;

		try {
			const linesWithGeom = (await fetchLines({
				lineIds: checkedIds,
				fieldsInclude: [
					'geometry',
					'title',
					'created_at',
					'custom_date',
				],
			})) as (LinePartial & { geometry?: LineString })[];

			// Per-point metadata for recorded lines (timestamps feed GPX
			// <time> / GeoJSON coordTimes).  One query for the whole batch.
			const trackPoints = await queryTrackPointsByLineIds(checkedIds);
			const pointsByLineId = new Map<number, typeof trackPoints>();
			for (const p of trackPoints) {
				const bucket = pointsByLineId.get(p.line_id);
				if (bucket) {
					bucket.push(p);
				} else {
					pointsByLineId.set(p.line_id, [p]);
				}
			}

			// Same for imported lines (line_points) — one query for the
			// whole batch, bucketed the same way.  A line has recording
			// metadata XOR imported metadata, never both.
			const linePoints = await queryLinePointsByLineIds(checkedIds);
			const linePointsByLineId = new Map<number, typeof linePoints>();
			for (const p of linePoints) {
				const bucket = linePointsByLineId.get(p.line_id);
				if (bucket) {
					bucket.push(p);
				} else {
					linePointsByLineId.set(p.line_id, [p]);
				}
			}

			total = linesWithGeom.filter((l) => l.geometry).length;
			setTotalCount(total);

			if (total === 0) {
				setResult({
					icon: 'close-circle-outline',
					header: t('lines.exportNoGeom'),
					details: [],
				});
				setPhase('result');
				return;
			}

			// Keep the process AND CPU alive if the app is backgrounded
			// mid-export (BackgroundTaskService wake lock).  start() never
			// throws — a notification failure must not abort the export.
			await bgTask.start(total);

			const prepTasks: PrepTask[] = linesWithGeom
				.filter((l) => l.geometry)
				.map((line) => {
					const safeTitle = line.title ?? line.id?.toString() ?? 'line';
					const rawDate = line.custom_date ?? line.created_at ?? null;
					const dateStr = rawDate ? dayjs(rawDate).format('YYYY-MM-DD') : 'no-date';
					const ext = selectedFormat === 'geojson' ? 'geojson' : selectedFormat;

					const resolved = resolveFilename(DEFAULT_TEMPLATE, {
						title: safeTitle,
						id: line.id,
						custom_date: dateStr,
					});
					const filename = `${sanitizeFilename(resolved)}.${ext}`;

					const recordedPoints = pointsByLineId.get(line.id);
					const importedPoints = linePointsByLineId.get(line.id);
					const pointsSource = recordedPoints?.length ? recordedPoints : importedPoints;

					// Content is built lazily inside the write loop:
					// building every file's string upfront would hold the
					// whole selection in memory at once (a 30k-point line
					// is ~2 MB of text) and block the JS thread.
					return {
						filename,
						buildContent: () =>
							writeFormat(selectedFormat, [
								{
									geometry: line.geometry!,
									meta: { title: line.title, custom_date: rawDate },
									points: alignPointsToCoords(
										line.geometry!.coordinates,
										pointsSource
									),
								},
							]),
					};
				});

			const batchSize = 20;
			const batches = chunk(prepTasks, batchSize);

			for (const batch of batches) {
				const results = await Promise.allSettled(
					batch.map(({ filename, buildContent }) =>
						writeFile(`${exportDir}/${filename}`, buildContent(), 'utf8')
					)
				);
				results.forEach((r, i) => {
					if (r.status === 'fulfilled') {
						written++;
					} else {
						logError('useExportCbModal.bulk.perFile', r.reason);
						failed.push(`${exportDir}/${batch[i].filename}`);
					}
				});
				setProgressCount(written);
				bgTask.update(written);

				if (stoppedRef.current) {
					const succeededDetails = prepTasks
						.slice(0, written + failed.length)
						.filter((_t) => {
							const fi = failed.findIndex((f) => f === `${exportDir}/${_t.filename}`);
							return fi === -1;
						})
						.map((t) => `${exportDir}/${t.filename}`);
					setResult({
						icon: 'alert-outline',
						header: sprintf(t('lines.exportStopped'), written, total),
						details: succeededDetails,
					});
					setPhase('result');
					return;
				}
			}

			if (failed.length === 0) {
				const allDetails = prepTasks.map((t) => `${exportDir}/${t.filename}`);
				setResult({
					icon: 'check-circle-outline',
					header: sprintf(t('lines.exportSuccess'), written, total),
					details: allDetails,
				});
			} else if (written === 0) {
				setResult({
					icon: 'close-circle-outline',
					header: t('lines.exportNoFilesWritten'),
					details: [],
				});
			} else {
				setResult({
					icon: 'alert-outline',
					header: sprintf(t('lines.exportPartial'), written, total, failed.length),
					details: failed,
				});
			}
		} catch (e) {
			logError('useExportCbModal.bulk', e);
			if (written > 0) {
				setResult({
					icon: 'alert-outline',
					header: sprintf(t('lines.exportPartial'), written, total, failed.length),
					details: failed,
				});
			} else {
				setResult({
					icon: 'close-circle-outline',
					header: t('errorGeneric'),
					details: [],
				});
			}
		} finally {
			// Unregister the keep-alive task on every exit path
			// (success, stopped, error).  No-op when never started.
			await bgTask.stop();
			setPhase('result');
		}
	}, [
		params,
		selectedFormat,
		exportDir,
		t,
		bgTask,
	]);

	const handleExport = params.type === 'single' ? handleExportSingle : handleExportBulk;

	const canExport =
		params.type === 'single'
			? !geomLoading && !!lineWithGeom?.geometry
			: params.checkedIds.length > 0;

	const buttonPropsExport = useButtonProps({
		mode: 'outlined',
		paddingHorizontal: true,
		disabled: !canExport,
	});

	const buttonPropsStop = useButtonProps({ isDestructive: true });

	const resultIconColor = useMemo(() => {
		if (!result) return theme.colors.primary;
		if (result.icon === 'check-circle-outline') return theme.colors.primary;
		if (result.icon === 'alert-outline') return theme.colors.tertiary;
		return theme.colors.error;
	}, [result, theme.colors]);

	const modalNode = useMemo(() => {
		if (!modalVisible) return undefined;

		return (
			<ModalWrapper
				visible={modalVisible}
				onDismiss={handleDismiss}
				dismissDisabled={phase === 'progress'}
				headerLabel={t('lines.export')}
			>
				{phase === 'format' && (
					<>
						{formatOptions.map((opt) => (
							<RadioListItem
								key={opt.key}
								opt={opt}
								onPress={() => setSelectedFormat(opt.key as ExportFormat)}
								status={selectedFormat === opt.key ? 'checked' : 'unchecked'}
								labelExtractor={extractLabel}
							/>
						))}
						<View style={styles.controlsRow}>
							<ButtonHighlight
								{...buttonPropsExport}
								onPress={handleExport}
							>
								{t('lines.export')}
							</ButtonHighlight>
						</View>
					</>
				)}

				{phase === 'progress' && (
					<>
						<View style={styles.progressRow}>
							<LoadingIndicator />
							<Text style={styles.progressText}>
								{params.type === 'single' || totalCount === 0
									? t('lines.exporting')
									: sprintf(t('lines.exportProgress'), progressCount, totalCount)}
							</Text>
						</View>
						{params.type === 'bulk' && (
							<View style={styles.controlsRow}>
								<ButtonHighlight
									{...buttonPropsStop}
									onPress={handleStop}
								>
									{t('cancel')}
								</ButtonHighlight>
							</View>
						)}
					</>
				)}

				{phase === 'result' && result && (
					<>
						<View style={styles.resultRow}>
							<View style={styles.resultIcon}>
								<Icon
									source={result.icon}
									size={24}
									color={resultIconColor}
								/>
							</View>
							<View style={styles.resultContent}>
								<Text>{result.header}</Text>
								{result.details.length > 0 &&
									result.details.map((d, i) => (
										<Text
											key={i}
											style={detailStyle}
										>
											{d}
										</Text>
									))}
							</View>
						</View>
					</>
				)}
			</ModalWrapper>
		);
	}, [
		modalVisible,
		phase,
		handleDismiss,
		handleExport,
		handleStop,
		selectedFormat,
		buttonPropsExport,
		buttonPropsStop,
		result,
		resultIconColor,
		progressCount,
		totalCount,
		params.type,
		t,
		detailStyle,
	]);

	return useMemo(() => ({ cb, modalNode }), [cb, modalNode]);
};

export default useExportCbModal;
