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
import { extractDateWithPattern, buildLinePoints, firstTimeIso } from '../utils';

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

			// Pre-fetch existing lines for all selected URIs in ONE
			// query instead of one full scan per file (skip/overwrite
			// modes and the dry-run skip simulation).  The expression
			// index on json_extract(data, '$.import.sourceFilePath')
			// (migration 0003) makes this an index lookup.
			const needExisting =
				overwriteMode !== 'create' && (!dryRun || overwriteMode === 'skip');
			let existingByUri = new Map<string, { id: number; trackIndex: number | null }[]>();
			if (needExisting && limitedUris.length > 0 && dbConnection?.drizzle) {
				try {
					const rows = await dbConnection.drizzle
						.select({ id: linesTable.id, data: linesTable.data })
						.from(linesTable)
						.where(sql`
							json_extract(
								${linesTable.data},
								'$.import.sourceFilePath'
							) IN ${limitedUris}
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
				} catch (err) {
					logError('import.preFetchExistingByUri', err);
					existingByUri = new Map();
				}
			}

			// Read-ahead: overlap the next file's native read with the
			// current file's JS-side parse/write.
			let pendingRead: Promise<string> | null = null;
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
				const name =
					dirFiles.find((f) => f.uri === uri)?.name ?? uri.split('/').pop() ?? uri;
				if (keepAppActive) bgTask.update(i + 1, name);
				try {
					const content = pendingRead ? await pendingRead : await readFile(uri, 'utf8');
					if (i + 1 < limitedUris.length) {
						pendingRead = readFile(limitedUris[i + 1], 'utf8');
					}
					// Yield once per file so a Stop press stays
					// responsive before the synchronous parse work.
					await new Promise<void>((resolve) => setTimeout(resolve, 0));
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
						results.push({
							name,
							success: false,
							error: t('import.noFeatures'),
							skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
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
						const existing = existingByUri.get(uri) ?? [];
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
							const existing = existingByUri.get(uri) ?? [];
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
						if (mergeMode) {
							const allCoords = validFeatures.flatMap((f) => f.geometry.coordinates);
							// Times only align with the merged geometry when
							// every feature has full time coverage.
							const mergedTimes = validTimes.every((t) => t != null)
								? (validTimes as number[][]).flat()
								: null;
							const dateFallback = firstTimeIso(mergedTimes);
							const merged: Feature<LineString, GeoJsonProperties> = {
								type: 'Feature',
								properties: {},
								geometry: { type: 'LineString', coordinates: allCoords },
							};
							if (mergedId != null) {
								await updateLine(mergedId, {
									title: deriveTitle(
										name,
										validFeatures.find((f) => f.properties?.name)?.properties
											?.name
									),
									lineStringFeature: merged,
									tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
									data: buildImportData(uri, name, null),
									custom_date: dateApplied ?? dateFallback ?? undefined,
								});
								await replaceLinePoints(
									[mergedId],
									buildLinePoints(mergedId, allCoords, mergedTimes)
								);
								overwritten++;
							} else {
								created = await createLines([
									{
										title: deriveTitle(
											name,
											validFeatures.find((f) => f.properties?.name)
												?.properties?.name
										),
										lineStringFeature: merged,
										tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
										data: buildImportData(uri, name, null),
										custom_date: dateApplied ?? dateFallback,
									},
								]);
								if (created && created.length > 0) {
									await createLinePoints(
										buildLinePoints(created[0].id, allCoords, mergedTimes)
									);
								}
							}
						} else if (overwriteMode === 'overwrite' && existingByIndex.size > 0) {
							const toCreate: Parameters<typeof createLines>[0] = [];
							const toCreateTimes: (number[] | null)[] = [];
							const toCreateFeatures: Feature<LineString, GeoJsonProperties>[] = [];
							const toUpdate: Parameters<typeof updateLinesBatch>[0] = [];
							const updatedIds: number[] = [];
							const updatedPointRows: LinePointInput[] = [];

							for (let idx = 0; idx < validFeatures.length; idx++) {
								const f = validFeatures[idx];
								const dateFallback = firstTimeIso(validTimes[idx]);
								const existingIds = existingByIndex.get(idx);
								if (existingIds && existingIds.length > 0) {
									for (const existingId of existingIds) {
										toUpdate.push({
											id: existingId,
											title: deriveTitle(name, f.properties?.name),
											lineStringFeature: f,
											tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
											custom_date: dateApplied ?? dateFallback ?? undefined,
											data: buildImportData(uri, name, idx),
										});
										updatedIds.push(existingId);
										updatedPointRows.push(
											...buildLinePoints(
												existingId,
												f.geometry.coordinates,
												validTimes[idx]
											)
										);
										overwritten++;
									}
									staleIdsToDelete = staleIdsToDelete.filter(
										(id) => !existingIds.includes(id)
									);
								} else {
									toCreate.push({
										title: deriveTitle(name, f.properties?.name),
										lineStringFeature: f,
										tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
										data: buildImportData(uri, name, idx),
										custom_date: dateApplied ?? dateFallback,
									});
									toCreateFeatures.push(f);
									toCreateTimes.push(validTimes[idx]);
								}
							}

							if (staleIdsToDelete.length > 0) {
								unmatchIds.push(...staleIdsToDelete);
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
									pointRows.push(
										...buildLinePoints(
											line.id,
											toCreateFeatures[i].geometry.coordinates,
											toCreateTimes[i]
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
							created = await createLines(
								validFeatures.map((f, idx) => ({
									title: deriveTitle(name, f.properties?.name),
									lineStringFeature: f,
									tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
									data: buildImportData(uri, name, idx),
									custom_date: dateApplied ?? firstTimeIso(validTimes[idx]),
								}))
							);
							if (created && created.length > 0) {
								const pointRows: LinePointInput[] = [];
								created.forEach((line, idx) => {
									pointRows.push(
										...buildLinePoints(
											line.id,
											validFeatures[idx].geometry.coordinates,
											validTimes[idx]
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
			throw new Error(t('import.noFeatures'));
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

		if (mergeMode) {
			const allCoords = toImport.flatMap((f) => f.geometry.coordinates);
			// Times only align with the merged geometry when every
			// feature has full time coverage.
			const mergedTimes = toImportTimes.every((t) => t != null)
				? (toImportTimes as number[][]).flat()
				: null;
			const dateFallback = firstTimeIso(mergedTimes);
			const merged: Feature<LineString, GeoJsonProperties> = {
				type: 'Feature',
				properties: {},
				geometry: { type: 'LineString', coordinates: allCoords },
			};
			if (mergedIdSingle != null) {
				await updateLine(mergedIdSingle, {
					title: deriveTitle(
						filename,
						toImport.find((f) => f.properties?.name)?.properties?.name
					),
					lineStringFeature: merged,
					tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
					data: buildImportData(sourceFilePath, filename, null),
					custom_date: dateApplied ?? dateFallback ?? undefined,
				});
				await replaceLinePoints(
					[mergedIdSingle],
					buildLinePoints(mergedIdSingle, allCoords, mergedTimes)
				);
				overwrittenSingle++;
			} else {
				createdSingle = await createLines([
					{
						title: deriveTitle(
							filename,
							toImport.find((f) => f.properties?.name)?.properties?.name
						),
						lineStringFeature: merged,
						tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
						data: buildImportData(sourceFilePath, filename, null),
						custom_date: dateApplied ?? dateFallback,
					},
				]);
				if (createdSingle && createdSingle.length > 0) {
					await createLinePoints(
						buildLinePoints(createdSingle[0].id, allCoords, mergedTimes)
					);
				}
			}
		} else if (overwriteMode === 'overwrite' && existingByIndexSingle.size > 0) {
			const toCreateSingle: Parameters<typeof createLines>[0] = [];
			const toCreateSingleTimes: (number[] | null)[] = [];
			const toCreateSingleFeatures: Feature<LineString, GeoJsonProperties>[] = [];
			const toUpdateSingle: Parameters<typeof updateLinesBatch>[0] = [];
			const updatedIdsSingle: number[] = [];
			const updatedPointRowsSingle: LinePointInput[] = [];

			for (let idx = 0; idx < toImport.length; idx++) {
				const feature = toImport[idx];
				const dateFallback = firstTimeIso(toImportTimes[idx]);
				const existingIds = existingByIndexSingle.get(idx);
				if (existingIds && existingIds.length > 0) {
					for (const existingId of existingIds) {
						toUpdateSingle.push({
							id: existingId,
							title: deriveTitle(filename, feature.properties?.name),
							lineStringFeature: feature,
							tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
							custom_date: dateApplied ?? dateFallback ?? undefined,
							data: buildImportData(sourceFilePath, filename, idx),
						});
						updatedIdsSingle.push(existingId);
						updatedPointRowsSingle.push(
							...buildLinePoints(
								existingId,
								feature.geometry.coordinates,
								toImportTimes[idx]
							)
						);
						overwrittenSingle++;
					}
					staleIdsToDeleteSingle = staleIdsToDeleteSingle.filter(
						(id) => !existingIds.includes(id)
					);
				} else {
					toCreateSingle.push({
						title: deriveTitle(filename, feature.properties?.name),
						lineStringFeature: feature,
						tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
						data: buildImportData(sourceFilePath, filename, idx),
						custom_date: dateApplied ?? dateFallback,
					});
					toCreateSingleFeatures.push(feature);
					toCreateSingleTimes.push(toImportTimes[idx]);
				}
			}

			if (staleIdsToDeleteSingle.length > 0) {
				unmatchIdsSingle.push(...staleIdsToDeleteSingle);
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
						pointRows.push(
							...buildLinePoints(
								line.id,
								toCreateSingleFeatures[i].geometry.coordinates,
								toCreateSingleTimes[i]
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
			const newLines = toImport.map((feature, idx) => ({
				title: deriveTitle(filename, feature.properties?.name),
				lineStringFeature: feature,
				tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
				data: buildImportData(sourceFilePath, filename, idx),
				custom_date: dateApplied ?? firstTimeIso(toImportTimes[idx]),
			}));
			createdSingle = await createLines(newLines);
			if (createdSingle && createdSingle.length > 0) {
				const pointRows: LinePointInput[] = [];
				createdSingle.forEach((line, idx) => {
					pointRows.push(
						...buildLinePoints(
							line.id,
							toImport[idx].geometry.coordinates,
							toImportTimes[idx]
						)
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
