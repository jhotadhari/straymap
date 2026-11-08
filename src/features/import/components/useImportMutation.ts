/**
 * External dependencies
 */
import { useCallback, useContext, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { readFile } from 'react-native-fs';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { logError } from '../../../lib/utils';
import { classifyRegex } from '../../../lib/regexUtils';
import useBackgroundTask from '../../../hooks/useBackgroundTask';
import { detectImportFormat, parseImportContent } from '../../lines/utils/importParser';
import { createLines, updateLine, updateLinesBatch } from '../../lines/db/actionsLine';
import {
	createLinePoints,
	replaceLinePoints,
	LinePointInput,
} from '../../lines/db/actionsLinePoints';
import { partSizes } from '../../lines/db/repairGiantGeometries';
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable, tagsTable } from '../../lines/db/schema/schema';
import { sql, inArray } from 'drizzle-orm';
import { ensureTagByLabel } from '../../lines/db/actionsTag';
import {
	invalidateTagsTable,
	invalidateLinesQueries,
	invalidateLineGeomQueries,
} from '../../lines/db/queryFns';
import { isValidGeometry, ImportFileResult } from '../types';
import { useAppSelector } from '../../../store/hooks';
import { useImportContext } from '../ImportContext';
import {
	selectFileLimit,
	selectTitleMode,
	selectTitleRegex,
	selectTagMode,
	selectTagRegexes,
	selectDryRun,
	selectMergeMode,
	selectOverwriteMode,
	selectAutoCustomDate,
	selectDatePatterns,
	selectKeepAppActive,
	selectSelectedTagIds,
} from '../selectors';
import {
	extractDateWithPattern,
	buildLinePoints,
	firstTimeIso,
	expandToWriteItems,
	partTitleSuffix,
} from '../utils';

const useImportMutation = () => {
	const {
		importMode,
		features,
		featureTimes,
		filename,
		sourceFilePath,
		selectedIndices,
		selectedFileUris,
		dirFiles,
		dismissedRef,
		stopRequestedRef,
		setStep,
		setBulkProgress,
		setImportResults,
		setImportAborted,
		handleCloseImporter,
	} = useImportContext();

	const fileLimit = useAppSelector(selectFileLimit);
	const titleMode = useAppSelector(selectTitleMode);
	const titleRegex = useAppSelector(selectTitleRegex);
	const tagMode = useAppSelector(selectTagMode);
	const tagRegexes = useAppSelector(selectTagRegexes);
	const selectedTagIds = useAppSelector(selectSelectedTagIds);
	const dryRun = useAppSelector(selectDryRun);
	const mergeMode = useAppSelector(selectMergeMode);
	const overwriteMode = useAppSelector(selectOverwriteMode);
	const autoCustomDate = useAppSelector(selectAutoCustomDate);
	const datePatterns = useAppSelector(selectDatePatterns);
	const keepAppActive = useAppSelector(selectKeepAppActive);

	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();
	const bgTask = useBackgroundTask('Importing routes');

	const importResultsRef = useRef<ImportFileResult[]>([]);
	const isImporting = useRef(false);
	const importBatchId = useRef(Date.now().toString(36));

	/**
	 * Batch-local cache for tag lookups (label and id namespaces).
	 * Directory imports resolve the same labels (e.g. 'imported' plus
	 * regex matches) for every file — without a cache each file would
	 * re-query the tags table.  Reset at the start of every mutation
	 * run so the cache never outlives the batch it was built for.
	 */
	const tagCacheRef = useRef<{
		byLabel: Map<string, { id?: number; label: string | null; data?: any }>;
		byId: Map<number, { id?: number; label: string | null; data?: any }>;
	}>({ byLabel: new Map(), byId: new Map() });

	const extractTagInfo = useCallback(
		(name: string): { labels: string[]; existingIds: number[] } => {
			const labels: string[] = ['imported'];
			const existingIds: number[] = [];

			if (tagMode === 'existing') {
				existingIds.push(...selectedTagIds);
			} else if (tagMode === 'regex' && tagRegexes.length > 0) {
				for (const r of tagRegexes) {
					if (!r) continue;
					const cls = classifyRegex(r, {
						checkCaptureGroup: true,
						checkEmptyCaptureGroup: true,
					});
					if (!cls.valid || !cls.hasCaptureGroup || cls.hasEmptyGroup) continue;
					const re = new RegExp(r, 'g');
					let match;
					while ((match = re.exec(name)) !== null) {
						if (match[0] === '') {
							re.lastIndex++;
							continue;
						}
						// Skip empty captures ((x*) groups) — an empty label
						// would create an empty-label tag in the DB.
						const label = match[1] ?? match[0];
						if (label) labels.push(label);
					}
				}
			}

			return { labels: [...new Set(labels)], existingIds };
		},
		[
			tagMode,
			selectedTagIds,
			tagRegexes,
		]
	);

	const resolveTagObjects = async (
		labels: string[],
		existingIds: number[],
		isDryRun: boolean
	): Promise<{ id?: number; label: string | null; data?: any }[]> => {
		const results: { id?: number; label: string | null; data?: any }[] = [];

		if (!dbConnection?.drizzle) return results;

		const { byLabel, byId } = tagCacheRef.current;

		if (labels.length > 0) {
			// Resolve only labels not seen before in this batch — one
			// WHERE label IN (...) query for all of them at once.
			const uncachedLabels = [...new Set(labels)].filter((l) => !byLabel.has(l));
			if (uncachedLabels.length > 0) {
				const labelRows = await dbConnection.drizzle
					.select({
						id: tagsTable.id,
						label: tagsTable.label,
						data: tagsTable.data,
					})
					.from(tagsTable)
					.where(inArray(tagsTable.label, uncachedLabels as string[]));
				for (const row of labelRows) {
					if (row.label != null) {
						byLabel.set(row.label, { id: row.id, label: row.label, data: row.data });
					}
				}
				// Labels not in the DB: create them once per batch
				// (real import) or cache the label-only object (dry run).
				for (const label of uncachedLabels) {
					if (byLabel.has(label)) continue;
					if (!isDryRun) {
						const id = await ensureTagByLabel(label);
						byLabel.set(label, id ? { id, label, data: undefined } : { label });
					} else {
						byLabel.set(label, { label });
					}
				}
			}
			for (const label of labels) {
				const entry = byLabel.get(label);
				if (entry) results.push(entry);
			}
		}

		if (existingIds.length > 0) {
			const uncachedIds = existingIds.filter((id) => !byId.has(id));
			if (uncachedIds.length > 0) {
				const idRows = await dbConnection.drizzle
					.select({
						id: tagsTable.id,
						label: tagsTable.label,
						data: tagsTable.data,
					})
					.from(tagsTable)
					.where(inArray(tagsTable.id, uncachedIds));
				for (const row of idRows) {
					byId.set(row.id, { id: row.id, label: row.label, data: row.data });
				}
				// Mark unresolvable ids so later files skip the lookup;
				// they are not pushed into results (no id, no label).
				for (const id of uncachedIds) {
					if (!byId.has(id)) byId.set(id, { label: null });
				}
			}
			for (const id of existingIds) {
				const entry = byId.get(id);
				if (entry && entry.id !== undefined) results.push(entry);
			}
		}

		const seen = new Set<string>();
		return results.filter((t) => {
			const key = t.label ?? '';
			if (seen.has(key)) return false;
			seen.add(key);
			return true;
		});
	};

	const buildImportData = useCallback(
		(uri: string, originalFilename: string, trackIndexInFile: number | null) => ({
			import: {
				sourceFilePath: uri,
				originalFilename,
				importBatchId: importBatchId.current,
				trackIndexInFile,
			},
		}),
		[]
	);

	const applyTitleRegex = useCallback(
		(name: string): string | null => {
			if (!titleRegex) return null;
			if (!classifyRegex(titleRegex).valid) return null;
			const match = name.match(new RegExp(titleRegex));
			return match?.[1] ?? null;
		},
		[titleRegex]
	);

	const deriveTitle = useCallback(
		(name: string, featurePropertiesName: string | undefined): string => {
			switch (titleMode) {
				case 'none':
					return '';
				case 'filenameWithoutExt':
					return name.replace(/\.[^.]+$/, '');
				case 'filenameWithExt':
					return name;
				case 'nameProperty':
					return featurePropertiesName ?? '';
				case 'regex':
					return applyTitleRegex(name) ?? '';
			}
		},
		[applyTitleRegex, titleMode]
	);

	const queryExistingBySourcePath = useCallback(
		async (sourcePath: string): Promise<{ id: number; trackIndex: number | null }[]> => {
			if (!dbConnection?.drizzle) return [];
			try {
				const rows = await dbConnection.drizzle
					.select({ id: linesTable.id, data: linesTable.data })
					.from(linesTable)
					.where(sql`
						json_extract(
							${linesTable.data},
							'$.import.sourceFilePath'
						) = ${sourcePath}
					`);
				return rows.map((r) => {
					const index = r.data?.import?.trackIndexInFile;
					return { id: r.id, trackIndex: typeof index === 'number' ? index : null };
				});
			} catch (err) {
				logError('import.queryExistingBySourcePath', err);
				return [];
			}
		},
		[]
	);

	const mutationFnRef = useRef<() => Promise<void>>(async () => {});
	const onSuccessRef = useRef<(...args: any[]) => void>(() => {});
	const onErrorRef = useRef<(err: Error) => void>(() => {});
	const onSettledRef = useRef<() => void>(() => {});

	mutationFnRef.current = async () => {
		if (isImporting.current) return;
		isImporting.current = true;
		importResultsRef.current = [];
		tagCacheRef.current = { byLabel: new Map(), byId: new Map() };
		if (importMode === 'directory') {
			const uris = Array.from(selectedFileUris);
			const limitedUris = fileLimit > 0 ? uris.slice(0, fileLimit) : uris;
			const results: ImportFileResult[] = [];

			if (keepAppActive) await bgTask.start(limitedUris.length);

			// Pre-fetch existing lines for all selected URIs (skip/overwrite
			// modes and the dry-run skip simulation).  The expression
			// index on json_extract(data, '$.import.sourceFilePath')
			// (migration 0003) makes this an index lookup.  Chunked so
			// very large selections stay well under SQLite's variable
			// limit and the SQL string stays small.
			const needExisting =
				overwriteMode !== 'create' && (!dryRun || overwriteMode === 'skip');
			const PRE_FETCH_CHUNK = 500;
			let existingByUri = new Map<string, { id: number; trackIndex: number | null }[]>();
			if (needExisting && limitedUris.length > 0 && dbConnection?.drizzle) {
				try {
					for (
						let chunkStart = 0;
						chunkStart < limitedUris.length;
						chunkStart += PRE_FETCH_CHUNK
					) {
						const chunkUris = limitedUris.slice(
							chunkStart,
							chunkStart + PRE_FETCH_CHUNK
						);
						const rows = await dbConnection.drizzle
							.select({ id: linesTable.id, data: linesTable.data })
							.from(linesTable)
							.where(sql`
								json_extract(
									${linesTable.data},
									'$.import.sourceFilePath'
								) IN ${chunkUris}
							`);
						for (const row of rows) {
							const sourcePath = row.data?.import?.sourceFilePath;
							if (typeof sourcePath !== 'string') continue;
							const index = row.data?.import?.trackIndexInFile;
							const entry = {
								id: row.id,
								trackIndex: typeof index === 'number' ? index : null,
							};
							const arr = existingByUri.get(sourcePath);
							if (arr) arr.push(entry);
							else existingByUri.set(sourcePath, [entry]);
						}
					}
				} catch (err) {
					logError('import.preFetchExistingByUri', err);
					existingByUri = new Map();
				}
			}

			// Read-ahead: overlap the next file's native read with the
			// current file's JS-side parse/write.  Files that will be
			// fast-skipped (already imported) are never read at all.
			const namesByUri = new Map<string, string>();
			for (const f of dirFiles) namesByUri.set(f.uri, f.name);
			let pendingRead: Promise<string> | null = null;
			let lastBgTaskUpdate = 0;
			for (let i = 0; i < limitedUris.length; i++) {
				if (dismissedRef.current || stopRequestedRef.current) {
					// Persist partial results before aborting so the
					// onError handler can show them on the result page.
					setImportResults(results);
					importResultsRef.current = results;
					throw { __aborted: true };
				}
				setBulkProgress({ current: i + 1, total: limitedUris.length });
				const uri = limitedUris[i];
				const name = namesByUri.get(uri) ?? uri.split('/').pop() ?? uri;

				// Fast path: skip mode + this file was already imported —
				// decide BEFORE reading/parsing the file.  A directory
				// re-import with thousands of preexisting files becomes
				// one map lookup per file instead of a disk read + GPX
				// parse per file.  (Dry runs stay faithful: they still
				// read/parse to preview per-file detail.)
				const existing = existingByUri.get(uri) ?? [];
				const fastSkip = !dryRun && overwriteMode === 'skip' && existing.length > 0;

				// Throttled native notification update (skipped files
				// included so the progress still advances).
				if (keepAppActive) {
					const now = Date.now();
					if (i === 0 || now - lastBgTaskUpdate >= 300 || i === limitedUris.length - 1) {
						lastBgTaskUpdate = now;
						bgTask.update(i + 1, name);
					}
				}

				if (fastSkip) {
					results.push({
						name,
						success: true,
						skipped: existing.length,
						isDryRun: false,
						mergeMode,
					});
					// No explicit yield here: a skipped file is a map
					// lookup + result push (~µs), so a whole skip-only
					// run completes within a few tens of milliseconds
					// synchronously.  setTimeout-based yields must NOT
					// be used in this loop — RN schedules JS timers on
					// choreographer frame boundaries, which stop
					// ticking in the background and would freeze the
					// import there.
					continue;
				}

				try {
					const content = pendingRead ? await pendingRead : await readFile(uri, 'utf8');
					const nextUri = i + 1 < limitedUris.length ? limitedUris[i + 1] : null;
					if (nextUri != null) {
						// Never prefetch a file that will be fast-skipped —
						// pendingRead must always hold the current file's
						// content (or be null).
						const nextExisting = existingByUri.get(nextUri) ?? [];
						const nextWillFastSkip =
							!dryRun && overwriteMode === 'skip' && nextExisting.length > 0;
						pendingRead = nextWillFastSkip ? null : readFile(nextUri, 'utf8');
					}
					// No explicit yield before the parse: the awaited
					// readFile above already returned control to the
					// event loop, so a Stop press gets processed between
					// files (the loop checks stopRequestedRef at the top
					// of every iteration).  Timers can't be used for
					// this — see the fastSkip note above.
					const format = detectImportFormat(name);
					if (!format) {
						results.push({
							name,
							success: false,
							error: sprintf(
								t('import.unsupportedFormat'),
								name.split('.').pop() ?? ''
							),
							isDryRun: dryRun,
							mergeMode,
						});
						continue;
					}
					const result = parseImportContent(content, format);
					const validFeatures: Feature<LineString, GeoJsonProperties>[] = [];
					const validTimes: (number[] | null)[] = [];
					for (let fi = 0; fi < result.features.length; fi++) {
						if (isValidGeometry(result.features[fi])) {
							validFeatures.push(result.features[fi]);
							validTimes.push(result.times[fi]);
						}
					}
					const skippedGeom = result.features.length - validFeatures.length;

					if (!validFeatures.length) {
						const tinyTotal = result.tinyCount + skippedGeom;
						results.push({
							name,
							success: false,
							error:
								result.features.length > 0 || tinyTotal > 0
									? t('import.noTrackPoints')
									: t('import.noFeatures'),
							skippedGeom: tinyTotal > 0 ? tinyTotal : undefined,
							isDryRun: dryRun,
							mergeMode,
						});
						continue;
					}

					let overwritten = 0;
					let existingByIndex: Map<number, number[]> = new Map();
					let staleIdsToDelete: number[] = [];
					let mergedId: number | null = null;
					let unmatchIds: number[] = [];

					if (!dryRun && overwriteMode !== 'create') {
						if (existing.length > 0) {
							if (overwriteMode === 'skip') {
								results.push({
									name,
									success: true,
									skipped: existing.length,
									skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
									isDryRun: dryRun,
									mergeMode,
								});
								continue;
							}
							if (mergeMode) {
								const nonMerged = existing.filter((r) => r.trackIndex != null);
								const mergedEntries = existing.filter((r) => r.trackIndex == null);
								mergedId = mergedEntries[0]?.id ?? null;
								unmatchIds.push(...nonMerged.map((r) => r.id));
								if (mergedEntries.length > 1) {
									unmatchIds.push(...mergedEntries.slice(1).map((r) => r.id));
								}
								// Only the single merged line is updated in
								// place — non-merged survivors and duplicate
								// merged entries go to unmatchIds instead.
								overwritten = mergedId != null ? 1 : 0;
							} else {
								for (const row of existing) {
									if (row.trackIndex != null) {
										const arr = existingByIndex.get(row.trackIndex) ?? [];
										arr.push(row.id);
										existingByIndex.set(row.trackIndex, arr);
									}
								}
								staleIdsToDelete = existing.map((r) => r.id);
							}
						}
					}

					const tagInfo = extractTagInfo(name);
					const dateResult = autoCustomDate
						? extractDateWithPattern(
								name,
								datePatterns.filter((p) => p.enabled)
							)
						: { date: null, patternName: null };
					const dateApplied = dateResult.date ?? undefined;
					const datePatternName = dateResult.patternName ?? undefined;

					let titleExtracted: string | undefined;
					let tracksWithNames: number | undefined;
					let tracksWithoutNames: number | undefined;
					if (mergeMode) {
						const t = deriveTitle(
							name,
							validFeatures.find((f) => f.properties?.name)?.properties?.name
						);
						if (t) titleExtracted = t;
					} else {
						let named = 0;
						let unnamed = 0;
						for (const f of validFeatures) {
							if (deriveTitle(name, f.properties?.name)) named++;
							else unnamed++;
						}
						tracksWithNames = named;
						tracksWithoutNames = unnamed;
					}

					if (dryRun) {
						if (overwriteMode === 'skip') {
							if (existing.length > 0) {
								const tags = await resolveTagObjects(
									tagInfo.labels,
									tagInfo.existingIds,
									true
								);
								results.push({
									name,
									success: true,
									skipped: existing.length,
									skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
									isDryRun: true,
									mergeMode,
									tracksTotal: validFeatures.length,
									titleMode,
									titleExtracted,
									tracksWithNames,
									tracksWithoutNames,
									tagMode,
									tags: tags.length > 0 ? tags : undefined,
									dateApplied,
									datePatternName,
								});
								continue;
							}
						}
						const tags = await resolveTagObjects(
							tagInfo.labels,
							tagInfo.existingIds,
							true
						);
						results.push({
							name,
							success: true,
							importedCount: mergeMode
								? Math.min(validFeatures.length, 1)
								: validFeatures.length,
							skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							isDryRun: true,
							mergeMode,
							tracksTotal: validFeatures.length,
							titleMode,
							titleExtracted,
							tracksWithNames,
							tracksWithoutNames,
							tagMode,
							tags: tags.length > 0 ? tags : undefined,
							dateApplied,
							datePatternName,
						});
						continue;
					}

					const tags = await resolveTagObjects(
						tagInfo.labels,
						tagInfo.existingIds,
						false
					);
					const rawIds = tags
						.map((t) => t.id)
						.filter((id): id is number => id !== undefined && id > 0);
					const uniqueTagIds = [...new Set(rawIds)];

					try {
						let created: Awaited<ReturnType<typeof createLines>> | undefined;
						const mergeTitle = deriveTitle(
							name,
							validFeatures.find((f) => f.properties?.name)?.properties?.name
						);
						if (mergeMode) {
							const allCoords = validFeatures.flatMap((f) => f.geometry.coordinates);
							// Times only align with the merged geometry when
							// every feature has full time coverage.
							const mergedTimes = validTimes.every((t) => t != null)
								? (validTimes as number[][]).flat()
								: null;
							const dateFallback = firstTimeIso(mergedTimes);
							// Split the merged output so no stored geometry
							// ever exceeds LINE_MAX_POINTS.
							const mergedItems: {
								feature: Feature<LineString, GeoJsonProperties>;
								times: number[] | null;
								part: number;
							}[] = [];
							let mergedOffset = 0;
							partSizes(allCoords.length).forEach((size, p) => {
								mergedItems.push({
									feature: {
										type: 'Feature',
										properties: {},
										geometry: {
											type: 'LineString',
											coordinates: allCoords.slice(
												mergedOffset,
												mergedOffset + size
											),
										},
									},
									times: mergedTimes
										? mergedTimes.slice(mergedOffset, mergedOffset + size)
										: null,
									part: p + 1,
								});
								mergedOffset += size;
							});
							const mergedPartTitle = (part: number) =>
								partTitleSuffix(mergeTitle, part, mergedItems.length);
							// Index of the first merged item that goes through
							// createLines (part 1 may update the existing
							// merged line in place instead).
							let mergedCreatedStart = 0;
							if (mergedId != null) {
								mergedCreatedStart = 1;
								const first = mergedItems[0];
								await updateLine(mergedId, {
									title: mergedPartTitle(1),
									lineStringFeature: first.feature,
									tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
									data: buildImportData(uri, name, null),
									custom_date: dateApplied ?? dateFallback ?? undefined,
								});
								await replaceLinePoints(
									[mergedId],
									buildLinePoints(
										mergedId,
										first.feature.geometry.coordinates,
										first.times
									)
								);
								overwritten++;
								if (mergedItems.length > 1) {
									created = await createLines(
										mergedItems.slice(1).map((item) => ({
											title: mergedPartTitle(item.part),
											lineStringFeature: item.feature,
											tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
											data: buildImportData(uri, name, null),
											custom_date: dateApplied ?? dateFallback,
										}))
									);
								}
							} else {
								created = await createLines(
									mergedItems.map((item) => ({
										title: mergedPartTitle(item.part),
										lineStringFeature: item.feature,
										tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
										data: buildImportData(uri, name, null),
										custom_date: dateApplied ?? dateFallback,
									}))
								);
							}
							if (created && created.length > 0) {
								const pointRows: LinePointInput[] = [];
								created.forEach((line, i) => {
									const item = mergedItems[mergedCreatedStart + i];
									pointRows.push(
										...buildLinePoints(
											line.id,
											item.feature.geometry.coordinates,
											item.times
										)
									);
								});
								if (pointRows.length) {
									await createLinePoints(pointRows);
								}
							}
						} else if (overwriteMode === 'overwrite' && existingByIndex.size > 0) {
							// Expand features into ≤LINE_MAX_POINTS write
							// items, grouped by original feature index so
							// parts pair 1:1 with existing line ids.
							const items = expandToWriteItems(validFeatures, validTimes);
							const itemsByIndex = new Map<number, typeof items>();
							for (const item of items) {
								const arr = itemsByIndex.get(item.trackIndex) ?? [];
								arr.push(item);
								itemsByIndex.set(item.trackIndex, arr);
							}

							const toCreate: Parameters<typeof createLines>[0] = [];
							const createPointInfo: {
								feature: Feature<LineString, GeoJsonProperties>;
								times: number[] | null;
							}[] = [];
							const toUpdate: Parameters<typeof updateLinesBatch>[0] = [];
							const updatedIds: number[] = [];
							const updatedPointRows: LinePointInput[] = [];
							const usedExistingIds = new Set<number>();

							for (const [idx, idxItems] of itemsByIndex) {
								const existingIds = [...(existingByIndex.get(idx) ?? [])].sort(
									(a, b) => a - b
								);
								const dateFallback = firstTimeIso(validTimes[idx]);
								const baseTitle = deriveTitle(
									name,
									validFeatures[idx]?.properties?.name
								);
								idxItems.forEach((item, j) => {
									const title = partTitleSuffix(
										baseTitle,
										item.part,
										item.partCount
									);
									if (j < existingIds.length) {
										const existingId = existingIds[j];
										usedExistingIds.add(existingId);
										toUpdate.push({
											id: existingId,
											title,
											lineStringFeature: item.feature,
											tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
											custom_date: dateApplied ?? dateFallback ?? undefined,
											data: buildImportData(uri, name, idx),
										});
										updatedIds.push(existingId);
										updatedPointRows.push(
											...buildLinePoints(
												existingId,
												item.feature.geometry.coordinates,
												item.times
											)
										);
										overwritten++;
									} else {
										toCreate.push({
											title,
											lineStringFeature: item.feature,
											tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
											data: buildImportData(uri, name, idx),
											custom_date: dateApplied ?? dateFallback,
										});
										createPointInfo.push({
											feature: item.feature,
											times: item.times,
										});
									}
								});
							}

							// Existing ids not paired with a part (track
							// indices gone from the file, or extra old
							// duplicates) go to the unmatched list.
							if (staleIdsToDelete.length > 0) {
								unmatchIds.push(
									...staleIdsToDelete.filter((id) => !usedExistingIds.has(id))
								);
							}

							// One batched transaction for all in-place
							// updates — avoids a transaction + several
							// round-trips per line (updateLine).
							if (toUpdate.length > 0) {
								await updateLinesBatch(toUpdate);
							}
							// Replace point metadata for every overwritten
							// line (stale rows must not survive even when
							// the new file has no usable timestamps).
							if (updatedIds.length > 0) {
								await replaceLinePoints(updatedIds, updatedPointRows);
							}
							created = toCreate.length > 0 ? await createLines(toCreate) : undefined;
							if (created && created.length > 0) {
								const pointRows: LinePointInput[] = [];
								created.forEach((line, i) => {
									const info = createPointInfo[i];
									pointRows.push(
										...buildLinePoints(
											line.id,
											info.feature.geometry.coordinates,
											info.times
										)
									);
								});
								if (pointRows.length) {
									await createLinePoints(pointRows);
								}
							}
						} else {
							if (staleIdsToDelete.length > 0) {
								unmatchIds.push(...staleIdsToDelete);
							}
							const items = expandToWriteItems(validFeatures, validTimes);
							created = await createLines(
								items.map((item) => ({
									title: partTitleSuffix(
										deriveTitle(
											name,
											validFeatures[item.trackIndex]?.properties?.name
										),
										item.part,
										item.partCount
									),
									lineStringFeature: item.feature,
									tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
									data: buildImportData(uri, name, item.trackIndex),
									custom_date:
										dateApplied ?? firstTimeIso(validTimes[item.trackIndex]),
								}))
							);
							if (created && created.length > 0) {
								const pointRows: LinePointInput[] = [];
								created.forEach((line, i) => {
									const item = items[i];
									pointRows.push(
										...buildLinePoints(
											line.id,
											item.feature.geometry.coordinates,
											item.times
										)
									);
								});
								if (pointRows.length) {
									await createLinePoints(pointRows);
								}
							}
						}
						results.push({
							name,
							success: true,
							importedCount: created?.length ?? 0,
							overwritten: overwritten > 0 ? overwritten : undefined,
							skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							unmatchedIds: unmatchIds.length > 0 ? unmatchIds : undefined,
							isDryRun: dryRun,
							mergeMode,
							tracksTotal: validFeatures.length,
							titleMode,
							titleExtracted,
							tracksWithNames,
							tracksWithoutNames,
							tagMode,
							tags: tags.length > 0 ? tags : undefined,
							dateApplied,
							datePatternName,
						});
					} catch (dbErr) {
						logError('ImportModal.bulkInsert', dbErr);
						results.push({
							name,
							success: false,
							error: (dbErr as Error)?.message ?? String(dbErr),
							skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							isDryRun: dryRun,
							mergeMode,
						});
					}
				} catch (err) {
					logError('ImportModal.bulkParse', err);
					results.push({
						name,
						success: false,
						error: (err as Error)?.message ?? String(err),
						isDryRun: dryRun,
						mergeMode,
					});
				}
			}
			setImportResults(results);
			importResultsRef.current = results;
			const anySuccess = results.some((r) => r.success);
			if (!anySuccess) {
				throw new Error(
					results.length > 0 ? t('import.resultAllFailed') : t('import.dirNoFiles')
				);
			}
			return;
		}

		const pairs: {
			feature: Feature<LineString, GeoJsonProperties>;
			times: number[] | null;
		}[] = [];
		features.forEach((feature, idx) => {
			if (selectedIndices.has(idx)) {
				pairs.push({ feature, times: featureTimes?.[idx] ?? null });
			}
		});
		const skippedCount = pairs.filter((p) => !isValidGeometry(p.feature)).length;
		const validPairs = pairs.filter((p) => isValidGeometry(p.feature));
		const toImport = validPairs.map((p) => p.feature);
		const toImportTimes = validPairs.map((p) => p.times);

		if (!toImport.length) {
			throw new Error(skippedCount > 0 ? t('import.noTrackPoints') : t('import.noFeatures'));
		}

		let overwrittenSingle = 0;
		let createdSingle: Awaited<ReturnType<typeof createLines>> | undefined;
		let existingByIndexSingle: Map<number, number[]> = new Map();
		let staleIdsToDeleteSingle: number[] = [];
		let mergedIdSingle: number | null = null;
		let unmatchIdsSingle: number[] = [];

		if (!dryRun && overwriteMode !== 'create') {
			const existing = await queryExistingBySourcePath(sourceFilePath);
			if (existing.length > 0) {
				if (overwriteMode === 'skip') {
					setImportResults([
						{
							name: filename,
							success: true,
							skipped: existing.length,
							skippedGeom: skippedCount > 0 ? skippedCount : undefined,
							isDryRun: dryRun,
							mergeMode,
						},
					]);
					return;
				}
				if (mergeMode) {
					const nonMerged = existing.filter((r) => r.trackIndex != null);
					const mergedEntries = existing.filter((r) => r.trackIndex == null);
					mergedIdSingle = mergedEntries[0]?.id ?? null;
					unmatchIdsSingle.push(...nonMerged.map((r) => r.id));
					if (mergedEntries.length > 1) {
						unmatchIdsSingle.push(...mergedEntries.slice(1).map((r) => r.id));
					}
					overwrittenSingle = existing.length;
				} else {
					for (const row of existing) {
						if (row.trackIndex != null) {
							const arr = existingByIndexSingle.get(row.trackIndex) ?? [];
							arr.push(row.id);
							existingByIndexSingle.set(row.trackIndex, arr);
						}
					}
					staleIdsToDeleteSingle = existing.map((r) => r.id);
				}
			}
		}

		const tagInfo = extractTagInfo(filename);
		const dateResult = autoCustomDate
			? extractDateWithPattern(
					filename,
					datePatterns.filter((p) => p.enabled)
				)
			: { date: null, patternName: null };
		const dateApplied = dateResult.date ?? undefined;
		const datePatternName = dateResult.patternName ?? undefined;

		let titleExtracted: string | undefined;
		let tracksWithNames: number | undefined;
		let tracksWithoutNames: number | undefined;
		if (mergeMode) {
			const t = deriveTitle(
				filename,
				toImport.find((f) => f.properties?.name)?.properties?.name
			);
			if (t) titleExtracted = t;
		} else {
			let named = 0;
			let unnamed = 0;
			for (const f of toImport) {
				if (deriveTitle(filename, f.properties?.name)) named++;
				else unnamed++;
			}
			tracksWithNames = named;
			tracksWithoutNames = unnamed;
		}

		if (dryRun) {
			if (overwriteMode === 'skip') {
				const existing = await queryExistingBySourcePath(sourceFilePath);
				if (existing.length > 0) {
					const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, true);
					const result = [
						{
							name: filename,
							success: true,
							skipped: existing.length,
							skippedGeom: skippedCount > 0 ? skippedCount : undefined,
							isDryRun: true,
							mergeMode,
							tracksTotal: toImport.length,
							titleMode,
							titleExtracted,
							tracksWithNames,
							tracksWithoutNames,
							tagMode,
							tags: tags.length > 0 ? tags : undefined,
							dateApplied,
							datePatternName,
						},
					];
					importResultsRef.current = result;
					setImportResults(result);
					return;
				}
			}
			const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, true);
			const result = [
				{
					name: filename,
					success: true,
					importedCount: mergeMode ? Math.min(toImport.length, 1) : toImport.length,
					skippedGeom: skippedCount > 0 ? skippedCount : undefined,
					isDryRun: true,
					mergeMode,
					tracksTotal: toImport.length,
					titleMode,
					titleExtracted,
					tracksWithNames,
					tracksWithoutNames,
					tagMode,
					tags: tags.length > 0 ? tags : undefined,
					dateApplied,
					datePatternName,
				},
			];
			importResultsRef.current = result;
			setImportResults(result);
			return;
		}

		const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, false);
		const rawIds = tags
			.map((t) => t.id)
			.filter((id): id is number => id !== undefined && id > 0);
		const uniqueTagIds = [...new Set(rawIds)];

		const mergeTitleSingle = deriveTitle(
			filename,
			toImport.find((f) => f.properties?.name)?.properties?.name
		);
		if (mergeMode) {
			const allCoords = toImport.flatMap((f) => f.geometry.coordinates);
			// Times only align with the merged geometry when every
			// feature has full time coverage.
			const mergedTimes = toImportTimes.every((t) => t != null)
				? (toImportTimes as number[][]).flat()
				: null;
			const dateFallback = firstTimeIso(mergedTimes);
			// Split the merged output so no stored geometry ever exceeds
			// LINE_MAX_POINTS.
			const mergedItems: {
				feature: Feature<LineString, GeoJsonProperties>;
				times: number[] | null;
				part: number;
			}[] = [];
			let mergedOffset = 0;
			partSizes(allCoords.length).forEach((size, p) => {
				mergedItems.push({
					feature: {
						type: 'Feature',
						properties: {},
						geometry: {
							type: 'LineString',
							coordinates: allCoords.slice(mergedOffset, mergedOffset + size),
						},
					},
					times: mergedTimes
						? mergedTimes.slice(mergedOffset, mergedOffset + size)
						: null,
					part: p + 1,
				});
				mergedOffset += size;
			});
			const mergedPartTitle = (part: number) =>
				partTitleSuffix(mergeTitleSingle, part, mergedItems.length);
			let mergedCreatedStart = 0;
			if (mergedIdSingle != null) {
				mergedCreatedStart = 1;
				const first = mergedItems[0];
				await updateLine(mergedIdSingle, {
					title: mergedPartTitle(1),
					lineStringFeature: first.feature,
					tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
					data: buildImportData(sourceFilePath, filename, null),
					custom_date: dateApplied ?? dateFallback ?? undefined,
				});
				await replaceLinePoints(
					[mergedIdSingle],
					buildLinePoints(mergedIdSingle, first.feature.geometry.coordinates, first.times)
				);
				overwrittenSingle++;
				if (mergedItems.length > 1) {
					createdSingle = await createLines(
						mergedItems.slice(1).map((item) => ({
							title: mergedPartTitle(item.part),
							lineStringFeature: item.feature,
							tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
							data: buildImportData(sourceFilePath, filename, null),
							custom_date: dateApplied ?? dateFallback,
						}))
					);
				}
			} else {
				createdSingle = await createLines(
					mergedItems.map((item) => ({
						title: mergedPartTitle(item.part),
						lineStringFeature: item.feature,
						tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
						data: buildImportData(sourceFilePath, filename, null),
						custom_date: dateApplied ?? dateFallback,
					}))
				);
			}
			if (createdSingle && createdSingle.length > 0) {
				const pointRows: LinePointInput[] = [];
				createdSingle.forEach((line, i) => {
					const item = mergedItems[mergedCreatedStart + i];
					pointRows.push(
						...buildLinePoints(line.id, item.feature.geometry.coordinates, item.times)
					);
				});
				if (pointRows.length) {
					await createLinePoints(pointRows);
				}
			}
		} else if (overwriteMode === 'overwrite' && existingByIndexSingle.size > 0) {
			const items = expandToWriteItems(toImport, toImportTimes);
			const itemsByIndex = new Map<number, typeof items>();
			for (const item of items) {
				const arr = itemsByIndex.get(item.trackIndex) ?? [];
				arr.push(item);
				itemsByIndex.set(item.trackIndex, arr);
			}

			const toCreateSingle: Parameters<typeof createLines>[0] = [];
			const createPointInfoSingle: {
				feature: Feature<LineString, GeoJsonProperties>;
				times: number[] | null;
			}[] = [];
			const toUpdateSingle: Parameters<typeof updateLinesBatch>[0] = [];
			const updatedIdsSingle: number[] = [];
			const updatedPointRowsSingle: LinePointInput[] = [];
			const usedExistingIdsSingle = new Set<number>();

			for (const [idx, idxItems] of itemsByIndex) {
				const existingIds = [...(existingByIndexSingle.get(idx) ?? [])].sort(
					(a, b) => a - b
				);
				const dateFallback = firstTimeIso(toImportTimes[idx]);
				const baseTitle = deriveTitle(filename, toImport[idx]?.properties?.name);
				idxItems.forEach((item, j) => {
					const title = partTitleSuffix(baseTitle, item.part, item.partCount);
					if (j < existingIds.length) {
						const existingId = existingIds[j];
						usedExistingIdsSingle.add(existingId);
						toUpdateSingle.push({
							id: existingId,
							title,
							lineStringFeature: item.feature,
							tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
							custom_date: dateApplied ?? dateFallback ?? undefined,
							data: buildImportData(sourceFilePath, filename, idx),
						});
						updatedIdsSingle.push(existingId);
						updatedPointRowsSingle.push(
							...buildLinePoints(
								existingId,
								item.feature.geometry.coordinates,
								item.times
							)
						);
						overwrittenSingle++;
					} else {
						toCreateSingle.push({
							title,
							lineStringFeature: item.feature,
							tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
							data: buildImportData(sourceFilePath, filename, idx),
							custom_date: dateApplied ?? dateFallback,
						});
						createPointInfoSingle.push({
							feature: item.feature,
							times: item.times,
						});
					}
				});
			}

			if (staleIdsToDeleteSingle.length > 0) {
				unmatchIdsSingle.push(
					...staleIdsToDeleteSingle.filter((id) => !usedExistingIdsSingle.has(id))
				);
			}

			if (toUpdateSingle.length > 0) {
				await updateLinesBatch(toUpdateSingle);
			}
			// Replace point metadata for every overwritten line (stale
			// rows must not survive even when the new file has no
			// usable timestamps).
			if (updatedIdsSingle.length > 0) {
				await replaceLinePoints(updatedIdsSingle, updatedPointRowsSingle);
			}
			if (toCreateSingle.length > 0) {
				createdSingle = await createLines(toCreateSingle);
				if (createdSingle && createdSingle.length > 0) {
					const pointRows: LinePointInput[] = [];
					createdSingle.forEach((line, i) => {
						const info = createPointInfoSingle[i];
						pointRows.push(
							...buildLinePoints(
								line.id,
								info.feature.geometry.coordinates,
								info.times
							)
						);
					});
					if (pointRows.length) {
						await createLinePoints(pointRows);
					}
				}
			}
		} else {
			if (staleIdsToDeleteSingle.length > 0) {
				unmatchIdsSingle.push(...staleIdsToDeleteSingle);
			}
			const items = expandToWriteItems(toImport, toImportTimes);
			createdSingle = await createLines(
				items.map((item) => ({
					title: partTitleSuffix(
						deriveTitle(filename, toImport[item.trackIndex]?.properties?.name),
						item.part,
						item.partCount
					),
					lineStringFeature: item.feature,
					tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
					data: buildImportData(sourceFilePath, filename, item.trackIndex),
					custom_date: dateApplied ?? firstTimeIso(toImportTimes[item.trackIndex]),
				}))
			);
			if (createdSingle && createdSingle.length > 0) {
				const pointRows: LinePointInput[] = [];
				createdSingle.forEach((line, i) => {
					const item = items[i];
					pointRows.push(
						...buildLinePoints(line.id, item.feature.geometry.coordinates, item.times)
					);
				});
				if (pointRows.length) {
					await createLinePoints(pointRows);
				}
			}
		}

		const result = [
			{
				name: filename,
				success: true,
				importedCount: createdSingle?.length ?? 0,
				overwritten: overwrittenSingle > 0 ? overwrittenSingle : undefined,
				skippedGeom: skippedCount > 0 ? skippedCount : undefined,
				unmatchedIds: unmatchIdsSingle.length > 0 ? unmatchIdsSingle : undefined,
				isDryRun: dryRun,
				mergeMode,
				tracksTotal: toImport.length,
				titleMode,
				titleExtracted,
				tracksWithNames,
				tracksWithoutNames,
				tagMode,
				tags: tags.length > 0 ? tags : undefined,
				dateApplied,
				datePatternName,
			},
		];
		importResultsRef.current = result;
		setImportResults(result);
	};
	onSuccessRef.current = (_data, _vars) => {
		// A re-entrant mutate() (double-tap) resolves immediately without
		// producing results — skip its side effects so it can't flash an
		// empty result page over a still-running import.
		if (!importResultsRef.current?.length) {
			return;
		}
		if (keepAppActive) bgTask.stop();
		invalidateLinesQueries(queryClient);
		invalidateLineGeomQueries(queryClient);
		invalidateTagsTable(queryClient);
		queryClient.invalidateQueries({ queryKey: ['linePoints'] });

		setStep('result');
	};
	onErrorRef.current = (err) => {
		if (keepAppActive) bgTask.stop();
		if ((err as any)?.__aborted) {
			// Clear the stop flag so a subsequent import in the same
			// session can start again (dry-run returns to configuration).
			const wasStopRequested = stopRequestedRef.current;
			stopRequestedRef.current = false;
			// Files may have been written before the stop — invalidate
			// the query cache so the lines browser reflects them without
			// an app restart (staleTime is Infinity across queries).
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateTagsTable(queryClient);
			queryClient.invalidateQueries({ queryKey: ['linePoints'] });
			// User-initiated stop with partial results: show them on the
			// result page instead of silently closing the importer.
			if (!dismissedRef.current && wasStopRequested && importResultsRef.current.length > 0) {
				setImportAborted(true);
				setStep('result');
			} else if (dryRun) {
				setStep('configuration');
			} else {
				handleCloseImporter();
			}
			return;
		}
		logError('ImportModal.import', err);
		showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));

		if (importResultsRef.current.length > 0) {
			setStep('result');
		} else {
			setStep('configuration');
		}
	};
	onSettledRef.current = () => {
		isImporting.current = false;
	};

	const mutation = useMutation({
		mutationFn: useCallback(async () => {
			return mutationFnRef.current();
		}, []),
		onSuccess: useCallback((_data: void, _vars: void) => {
			onSuccessRef.current(_data, _vars);
		}, []),
		onError: useCallback((err: Error) => {
			onErrorRef.current(err);
		}, []),
		onSettled: useCallback(() => {
			onSettledRef.current();
		}, []),
	});

	return mutation;
};

export default useImportMutation;
