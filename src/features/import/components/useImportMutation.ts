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
import { createLines, updateLine } from '../../lines/db/actionsLine';
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable, tagsTable } from '../../lines/db/schema/schema';
import { sql, inArray } from 'drizzle-orm';
import { ensureTagByLabel } from '../../lines/db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries, invalidateLineGeomQueries } from '../../lines/db/queryFns';
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
import { extractDateWithPattern } from '../utils';

const useImportMutation = () => {
	const {
		importMode,
		features,
		filename,
		sourceFilePath,
		selectedIndices,
		selectedFileUris,
		dirFiles,
		dismissedRef,
		setStep,
		setBulkProgress,
		setImportResults,
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
						if (match[0] === '') { re.lastIndex++; continue; }
						labels.push(match[1] ?? match[0]);
					}
				}
			}

			return { labels: [...new Set(labels)], existingIds };
		},
		[tagMode, selectedTagIds, tagRegexes]
	);

	const resolveTagObjects = async (
		labels: string[],
		existingIds: number[],
		isDryRun: boolean
	): Promise<{ id?: number; label: string | null; data?: any }[]> => {
		const results: { id?: number; label: string | null; data?: any }[] = [];

		if (!dbConnection?.drizzle) return results;

		if (labels.length > 0) {
			const labelRows = await dbConnection.drizzle
				.select({
					id: tagsTable.id,
					label: tagsTable.label,
					data: tagsTable.data,
				})
				.from(tagsTable)
				.where(inArray(tagsTable.label, labels as string[]));
			results.push(...labelRows);

			const foundLabels = new Set(labelRows.map((t) => t.label));
			for (const label of labels) {
				if (foundLabels.has(label)) continue;
				if (!isDryRun) {
					const id = await ensureTagByLabel(label);
					if (id) results.push({ id, label, data: undefined });
				} else {
					results.push({ label, data: undefined });
				}
			}
		}

		if (existingIds.length > 0) {
			const idRows = await dbConnection.drizzle
				.select({
					id: tagsTable.id,
					label: tagsTable.label,
					data: tagsTable.data,
				})
				.from(tagsTable)
				.where(inArray(tagsTable.id, existingIds));
			results.push(...idRows);
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
		async (
			sourcePath: string
		): Promise<{ id: number; trackIndex: number | null }[]> => {
			if (!dbConnection?.drizzle) return [];
			try {
				const rows = await dbConnection.drizzle
					.select({ id: linesTable.id, data: linesTable.data })
					.from(linesTable)
					.where(
						sql`json_extract(${linesTable.data}, '$.import.sourceFilePath') = ${sourcePath}`
					);
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
			if (importMode === 'directory') {
				const uris = Array.from(selectedFileUris);
				const limitedUris = fileLimit > 0 ? uris.slice(0, fileLimit) : uris;
				const results: ImportFileResult[] = [];

				if (keepAppActive) await bgTask.start(limitedUris.length);

				for (let i = 0; i < limitedUris.length; i++) {
					if (dismissedRef.current) {
						throw { __aborted: true };
					}
					setBulkProgress({ current: i + 1, total: limitedUris.length });
					const uri = limitedUris[i];
					const name = dirFiles.find((f) => f.uri === uri)?.name ?? uri.split('/').pop() ?? uri;
					if (keepAppActive) bgTask.update(i + 1, name);
					try {
						const content = await readFile(uri, 'utf8');
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
						const validFeatures = result.features.filter(isValidGeometry);
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
							const existing = await queryExistingBySourcePath(uri);
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
									overwritten = existing.length;
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
							? extractDateWithPattern(name, datePatterns.filter((p) => p.enabled))
							: { date: null, patternName: null };
						const dateApplied = dateResult.date ?? undefined;
						const datePatternName = dateResult.patternName ?? undefined;

						let titleExtracted: string | undefined;
						let tracksWithNames: number | undefined;
						let tracksWithoutNames: number | undefined;
						if (mergeMode) {
							const t = deriveTitle(name, validFeatures.find(f => f.properties?.name)?.properties?.name);
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
								const existing = await queryExistingBySourcePath(uri);
								if (existing.length > 0) {
									const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, true);
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
							const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, true);
							results.push({
								name,
								success: true,
								importedCount: mergeMode ? Math.min(validFeatures.length, 1) : validFeatures.length,
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

						const tags = await resolveTagObjects(tagInfo.labels, tagInfo.existingIds, false);
						const rawIds = tags
							.map((t) => t.id)
							.filter((id): id is number => id !== undefined && id > 0);
						const uniqueTagIds = [...new Set(rawIds)];

						try {
							let created: Awaited<ReturnType<typeof createLines>> | undefined;
							if (mergeMode) {
								const allCoords = validFeatures.flatMap((f) => f.geometry.coordinates);
								const merged: Feature<LineString, GeoJsonProperties> = {
									type: 'Feature',
									properties: {},
									geometry: { type: 'LineString', coordinates: allCoords },
								};
								if (mergedId != null) {
									await updateLine(mergedId, {
										title: deriveTitle(name, validFeatures.find(f => f.properties?.name)?.properties?.name),
										lineStringFeature: merged,
										tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
										data: buildImportData(uri, name, null),
										custom_date: dateApplied ?? undefined,
									});
									overwritten++;
								} else {
									created = await createLines([
										{
											title: deriveTitle(name, validFeatures.find(f => f.properties?.name)?.properties?.name),
											lineStringFeature: merged,
											tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
											data: buildImportData(uri, name, null),
											custom_date: dateApplied,
										},
									]);
								}
							} else if (overwriteMode === 'overwrite' && existingByIndex.size > 0) {
								const toCreate: Parameters<typeof createLines>[0] = [];

								for (let idx = 0; idx < validFeatures.length; idx++) {
									const f = validFeatures[idx];
									const existingIds = existingByIndex.get(idx);
									if (existingIds && existingIds.length > 0) {
										for (const existingId of existingIds) {
											await updateLine(existingId, {
												title: deriveTitle(name, f.properties?.name),
												lineStringFeature: f,
												tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
												custom_date: dateApplied ?? undefined,
												data: buildImportData(uri, name, idx),
											});
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
											custom_date: dateApplied,
										});
									}
								}

								if (staleIdsToDelete.length > 0) {
									unmatchIds.push(...staleIdsToDelete);
								}

								created = toCreate.length > 0 ? await createLines(toCreate) : undefined;
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
										custom_date: dateApplied,
									}))
								);
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

			let toImport = features.filter((_, idx) => selectedIndices.has(idx));
			const skippedCount = toImport.length - toImport.filter(isValidGeometry).length;
			toImport = toImport.filter(isValidGeometry);

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
				? extractDateWithPattern(filename, datePatterns.filter((p) => p.enabled))
				: { date: null, patternName: null };
			const dateApplied = dateResult.date ?? undefined;
			const datePatternName = dateResult.patternName ?? undefined;

			let titleExtracted: string | undefined;
			let tracksWithNames: number | undefined;
			let tracksWithoutNames: number | undefined;
			if (mergeMode) {
				const t = deriveTitle(filename, toImport.find(f => f.properties?.name)?.properties?.name);
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
				const merged: Feature<LineString, GeoJsonProperties> = {
					type: 'Feature',
					properties: {},
					geometry: { type: 'LineString', coordinates: allCoords },
				};
				if (mergedIdSingle != null) {
					await updateLine(mergedIdSingle, {
						title: deriveTitle(filename, toImport.find(f => f.properties?.name)?.properties?.name),
						lineStringFeature: merged,
						tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
						data: buildImportData(sourceFilePath, filename, null),
						custom_date: dateApplied ?? undefined,
					});
					overwrittenSingle++;
				} else {
					createdSingle = await createLines([
						{
							title: deriveTitle(filename, toImport.find(f => f.properties?.name)?.properties?.name),
							lineStringFeature: merged,
							tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
							data: buildImportData(sourceFilePath, filename, null),
							custom_date: dateApplied,
						},
					]);
				}
			} else if (overwriteMode === 'overwrite' && existingByIndexSingle.size > 0) {
				const toCreateSingle: Parameters<typeof createLines>[0] = [];

				for (let idx = 0; idx < toImport.length; idx++) {
					const feature = toImport[idx];
					const existingIds = existingByIndexSingle.get(idx);
					if (existingIds && existingIds.length > 0) {
						for (const existingId of existingIds) {
							await updateLine(existingId, {
								title: deriveTitle(filename, feature.properties?.name),
								lineStringFeature: feature,
								tagIds: uniqueTagIds.length ? uniqueTagIds : undefined,
								custom_date: dateApplied ?? undefined,
								data: buildImportData(sourceFilePath, filename, idx),
							});
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
							custom_date: dateApplied,
						});
					}
				}

				if (staleIdsToDeleteSingle.length > 0) {
					unmatchIdsSingle.push(...staleIdsToDeleteSingle);
				}

				if (toCreateSingle.length > 0) {
					createdSingle = await createLines(toCreateSingle);
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
					custom_date: dateApplied,
				}));
				createdSingle = await createLines(newLines);
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
			if (keepAppActive) bgTask.stop();
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateTagsTable(queryClient);

			setStep('result');
	};
	onErrorRef.current = (err) => {
			if (keepAppActive) bgTask.stop();
			if ((err as any)?.__aborted) {
				if (dryRun) {
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
