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
import { createLines, deleteLines, updateLine } from '../../lines/db/actionsLine';
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable } from '../../lines/db/schema/schema';
import { sql } from 'drizzle-orm';
import { ensureTagByLabel } from '../../lines/db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries, invalidateLineGeomQueries } from '../../lines/db/queryFns';
import { isValidGeometry, ImportFileResult } from './types';
import { useImportContext } from './ImportContext';
import { useAppSelector } from '../../../store/hooks';
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
} from '../selectors';
import { extractDateFromFilename } from '../utils';

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
		selectedTagIds,
	} = useImportContext();

	const fileLimit = useAppSelector(selectFileLimit);
	const titleMode = useAppSelector(selectTitleMode);
	const titleRegex = useAppSelector(selectTitleRegex);
	const tagMode = useAppSelector(selectTagMode);
	const tagRegexes = useAppSelector(selectTagRegexes);
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

	const getOrCreateImportTag = useCallback(async (): Promise<number | undefined> => {
		return ensureTagByLabel('imported');
	}, []);

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

	const buildDeriveTagIds = useCallback(
		async (name: string): Promise<number[]> => {
			const tagIds: number[] = [];
			const importedId = await getOrCreateImportTag();
			if (importedId) tagIds.push(importedId);
			if (tagMode === 'existing') {
				for (const tid of selectedTagIds) tagIds.push(tid);
			} else if (tagMode === 'regex' && tagRegexes.length > 0) {
				for (const r of tagRegexes) {
					if (!r || !classifyRegex(r, { checkCaptureGroup: true }).valid) continue;
					const re = new RegExp(r, 'g');
					let match;
					while ((match = re.exec(name)) !== null) {
						if (match[0] === '') { re.lastIndex++; continue; }
						const label = match[1] ?? match[0];
						const id = await ensureTagByLabel(label);
						if (id) tagIds.push(id);
					}
				}
			}
			return [...new Set(tagIds)];
		},
		[tagMode, selectedTagIds, tagRegexes, getOrCreateImportTag]
	);

	const queryExistingBySourcePath = async (
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
	};

	const mutation = useMutation({
		mutationFn: async () => {
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
							});
							continue;
						}

						let overwritten = 0;
						let existingIdxMap: Map<number, number> = new Map();
						let staleIdsToDelete: number[] = [];

						if (!dryRun && overwriteMode !== 'create') {
							const existing = await queryExistingBySourcePath(uri);
							if (existing.length > 0) {
								if (overwriteMode === 'skip') {
									results.push({
										name,
										success: true,
										skipped: existing.length,
										skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
									});
									continue;
								}
								if (mergeMode) {
									await deleteLines(existing.map((r) => r.id));
									overwritten = existing.length;
								} else {
									for (const row of existing) {
										if (row.trackIndex != null) {
											existingIdxMap.set(row.trackIndex, row.id);
										}
									}
									staleIdsToDelete = existing.map((r) => r.id);
								}
							}
						}

						if (dryRun) {
							if (overwriteMode === 'skip') {
								const existing = await queryExistingBySourcePath(uri);
								if (existing.length > 0) {
									results.push({
										name,
										success: true,
										skipped: existing.length,
										skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
									});
									continue;
								}
							}
							results.push({
								name,
								success: true,
								importedCount: mergeMode ? Math.min(validFeatures.length, 1) : validFeatures.length,
								skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							});
							continue;
						}

						const tagIds = await buildDeriveTagIds(name);
						const customDateDir = autoCustomDate
							? extractDateFromFilename(name, datePatterns.filter((p) => p.enabled))
							: undefined;

						try {
							let created: Awaited<ReturnType<typeof createLines>>;
							if (mergeMode) {
								const allCoords = validFeatures.flatMap((f) => f.geometry.coordinates);
								const merged: Feature<LineString, GeoJsonProperties> = {
									type: 'Feature',
									properties: {},
									geometry: { type: 'LineString', coordinates: allCoords },
								};
								created = await createLines([
									{
										title: deriveTitle(name, validFeatures[0]?.properties?.name),
										lineStringFeature: merged,
										tagIds: tagIds.length ? tagIds : undefined,
										data: buildImportData(uri, name, null),
										custom_date: customDateDir,
									},
								]);
							} else if (overwriteMode === 'overwrite' && existingIdxMap.size > 0) {
								const toCreate: Parameters<typeof createLines>[0] = [];

								for (let idx = 0; idx < validFeatures.length; idx++) {
									const f = validFeatures[idx];
									const existingId = existingIdxMap.get(idx);
									if (existingId != null) {
										staleIdsToDelete = staleIdsToDelete.filter(
											(id) => id !== existingId
										);
										await updateLine(existingId, {
											title: deriveTitle(name, f.properties?.name),
											lineStringFeature: f,
											tagIds: tagIds.length ? tagIds : undefined,
											custom_date: customDateDir ?? undefined,
											data: buildImportData(uri, name, idx),
										});
										overwritten++;
									} else {
										toCreate.push({
											title: deriveTitle(name, f.properties?.name),
											lineStringFeature: f,
											tagIds: tagIds.length ? tagIds : undefined,
											data: buildImportData(uri, name, idx),
											custom_date: customDateDir,
										});
									}
								}

								if (staleIdsToDelete.length > 0) {
									await deleteLines(staleIdsToDelete);
								}

								created = toCreate.length > 0 ? await createLines(toCreate) : undefined;
							} else {
								created = await createLines(
									validFeatures.map((f, idx) => ({
										title: deriveTitle(name, f.properties?.name),
										lineStringFeature: f,
										tagIds: tagIds.length ? tagIds : undefined,
										data: buildImportData(uri, name, idx),
										custom_date: customDateDir,
									}))
								);
							}
							results.push({
								name,
								success: true,
								importedCount: created?.length ?? validFeatures.length,
								overwritten: overwritten > 0 ? overwritten : undefined,
								skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							});
						} catch (dbErr) {
							logError('ImportModal.bulkInsert', dbErr);
							results.push({
								name,
								success: false,
								error: (dbErr as Error)?.message ?? String(dbErr),
								skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							});
						}
					} catch (err) {
						logError('ImportModal.bulkParse', err);
						results.push({
							name,
							success: false,
							error: (err as Error)?.message ?? String(err),
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
			let existingIdxMapSingle: Map<number, number> = new Map();
			let staleIdsToDeleteSingle: number[] = [];

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
							},
						]);
						return;
					}
					if (mergeMode) {
						await deleteLines(existing.map((r) => r.id));
						overwrittenSingle = existing.length;
					} else {
						for (const row of existing) {
							if (row.trackIndex != null) {
								existingIdxMapSingle.set(row.trackIndex, row.id);
							}
						}
						staleIdsToDeleteSingle = [...existingIdxMapSingle.values()];
					}
				}
			}

			if (dryRun) {
				if (overwriteMode === 'skip') {
					const existing = await queryExistingBySourcePath(sourceFilePath);
					if (existing.length > 0) {
						const result = [
							{
								name: filename,
								success: true,
								skipped: existing.length,
								skippedGeom: skippedCount > 0 ? skippedCount : undefined,
							},
						];
						importResultsRef.current = result;
						setImportResults(result);
						return;
					}
				}
				const result = [
					{
						name: filename,
						success: true,
						importedCount: mergeMode ? Math.min(toImport.length, 1) : toImport.length,
						skippedGeom: skippedCount > 0 ? skippedCount : undefined,
					},
				];
				importResultsRef.current = result;
				setImportResults(result);
				return;
			}

			const tagIds = await buildDeriveTagIds(filename);
			const customDateSingle = autoCustomDate
				? extractDateFromFilename(filename, datePatterns.filter((p) => p.enabled))
				: undefined;

			if (mergeMode) {
				const allCoords = toImport.flatMap((f) => f.geometry.coordinates);
				const merged: Feature<LineString, GeoJsonProperties> = {
					type: 'Feature',
					properties: {},
					geometry: { type: 'LineString', coordinates: allCoords },
				};
				await createLines([
					{
						title: deriveTitle(filename, toImport[0]?.properties?.name),
						lineStringFeature: merged,
						tagIds: tagIds.length ? tagIds : undefined,
						data: buildImportData(sourceFilePath, filename, null),
						custom_date: customDateSingle,
					},
				]);
			} else if (overwriteMode === 'overwrite' && existingIdxMapSingle.size > 0) {
				const toCreateSingle: Parameters<typeof createLines>[0] = [];

				for (let idx = 0; idx < toImport.length; idx++) {
					const feature = toImport[idx];
					const existingId = existingIdxMapSingle.get(idx);
					if (existingId != null) {
						staleIdsToDeleteSingle = staleIdsToDeleteSingle.filter(
							(id) => id !== existingId
						);
						await updateLine(existingId, {
							title: deriveTitle(filename, feature.properties?.name),
							lineStringFeature: feature,
							tagIds: tagIds.length ? tagIds : undefined,
							custom_date: customDateSingle ?? undefined,
							data: buildImportData(sourceFilePath, filename, idx),
						});
						overwrittenSingle++;
					} else {
						toCreateSingle.push({
							title: deriveTitle(filename, feature.properties?.name),
							lineStringFeature: feature,
							tagIds: tagIds.length ? tagIds : undefined,
							data: buildImportData(sourceFilePath, filename, idx),
							custom_date: customDateSingle,
						});
					}
				}

				if (staleIdsToDeleteSingle.length > 0) {
					await deleteLines(staleIdsToDeleteSingle);
				}

				if (toCreateSingle.length > 0) {
					await createLines(toCreateSingle);
				}
			} else {
				const newLines = toImport.map((feature, idx) => ({
					title: deriveTitle(filename, feature.properties?.name),
					lineStringFeature: feature,
					tagIds: tagIds.length ? tagIds : undefined,
					data: buildImportData(sourceFilePath, filename, idx),
					custom_date: customDateSingle,
				}));
				await createLines(newLines);
			}

			const result = [
				{
					name: filename,
					success: true,
					importedCount: mergeMode ? 1 : toImport.length,
					overwritten: overwrittenSingle > 0 ? overwrittenSingle : undefined,
					skippedGeom: skippedCount > 0 ? skippedCount : undefined,
				},
			];
			importResultsRef.current = result;
			setImportResults(result);
		},
		onSuccess: (_data, _vars) => {
			if (keepAppActive) bgTask.stop();
			invalidateLinesQueries(queryClient);
			invalidateLineGeomQueries(queryClient);
			invalidateTagsTable(queryClient);

			setStep('result');
		},
		onError: (err) => {
			if (keepAppActive) bgTask.stop();
			if ((err as any)?.__aborted) {
				setStep('preview');
				return;
			}
			logError('ImportModal.import', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));

			if (importResultsRef.current.length > 0) {
				setStep('result');
			} else {
				setStep('preview');
			}
		},
		onSettled: () => {
			isImporting.current = false;
		},
	});

	return mutation;
};

export default useImportMutation;
