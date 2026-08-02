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
import { createLines, deleteLines } from '../../lines/db/actionsLine';
import { dbConnection } from '../../dbLoader/DBConnection';
import { linesTable } from '../../lines/db/schema/schema';
import { sql } from 'drizzle-orm';
import { ensureTagByLabel } from '../../lines/db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries } from '../../lines/db/queryFns';
import { isValidGeometry, ImportFileResult } from './types';
import { useImportContext } from './ImportContext';
import { useAppSelector } from '../../../store/hooks';
import {
	selectFileLimit,
	selectTitleRegex,
	selectTagMode,
	selectTagRegex,
	selectDryRun,
	selectOverwriteMode,
	selectAutoCustomDate,
	selectDatePatterns,
	selectKeepAppActive,
} from '../selectors';
import { extractDateFromFilename } from '../utils';

const useImportMutation = () => {
	const {
		importMode,
		mergeMode,
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
	const titleRegex = useAppSelector(selectTitleRegex);
	const tagMode = useAppSelector(selectTagMode);
	const tagRegex = useAppSelector(selectTagRegex);
	const dryRun = useAppSelector(selectDryRun);
	const overwriteMode = useAppSelector(selectOverwriteMode);
	const autoCustomDate = useAppSelector(selectAutoCustomDate);
	const datePatterns = useAppSelector(selectDatePatterns);
	const keepAppActive = useAppSelector(selectKeepAppActive);

	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();
	const bgTask = useBackgroundTask('Importing routes');

	const importResultsRef = useRef<ImportFileResult[]>([]);
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
		(name: string, fallback: string): string => {
			return applyTitleRegex(name) ?? fallback;
		},
		[applyTitleRegex]
	);

	const buildDeriveTagIds = useCallback(
		async (name: string): Promise<number[]> => {
			const tagIds: number[] = [];
			const importedId = await getOrCreateImportTag();
			if (importedId) tagIds.push(importedId);
			if (tagMode === 'existing') {
				for (const tid of selectedTagIds) tagIds.push(tid);
			} else if (tagMode === 'regex' && tagRegex) {
				if (!classifyRegex(tagRegex).valid) return [];
				const re = new RegExp(tagRegex, 'g');
				let match;
				while ((match = re.exec(name)) !== null) {
					const label = match[1] ?? match[0];
					const id = await ensureTagByLabel(label);
					if (id) tagIds.push(id);
				}
			}
			return [...new Set(tagIds)];
		},
		[tagMode, selectedTagIds, tagRegex, getOrCreateImportTag]
	);

	const queryExistingIdsBySourcePath = async (sourcePath: string): Promise<number[]> => {
		if (!dbConnection?.drizzle) return [];
		try {
			const rows = await dbConnection.drizzle
				.select({ id: linesTable.id })
				.from(linesTable)
				.where(
					sql`json_extract(${linesTable.data}, '$.import.sourceFilePath') = ${sourcePath}`
				);
			return rows.map((r) => r.id);
		} catch {
			return [];
		}
	};

	const mutation = useMutation({
		mutationFn: async () => {
			importResultsRef.current = [];
			if (importMode === 'directory') {
				const uris = Array.from(selectedFileUris);
				const limitedUris = fileLimit > 0 ? uris.slice(0, fileLimit) : uris;
				const results: ImportFileResult[] = [];

				if (keepAppActive) await bgTask.start(limitedUris.length);

				for (let i = 0; i < limitedUris.length; i++) {
					if (dismissedRef.current) {
						return;
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

						if (!dryRun && overwriteMode !== 'create') {
							const existingIds = await queryExistingIdsBySourcePath(uri);
							if (existingIds.length > 0) {
								if (overwriteMode === 'skip') {
									results.push({
										name,
										success: true,
										skipped: existingIds.length,
										skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
									});
									continue;
								}
								overwritten = existingIds.length;
								await deleteLines(existingIds);
							}
						}

						if (dryRun) {
							results.push({
								name,
								success: true,
								importedCount: validFeatures.length,
								skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							});
							continue;
						}

						const tagIds = await buildDeriveTagIds(name);
						const baseTitle = name.replace(/\.[^.]+$/, '');
						const customDateDir = autoCustomDate
							? extractDateFromFilename(name, datePatterns.filter((p) => p.enabled))
							: undefined;

						try {
							const created = await createLines(
								validFeatures.map((f, idx) => ({
									title: deriveTitle(
										name,
										f.properties?.name ??
											baseTitle +
												(validFeatures.length > 1 ? ` ${idx + 1}` : '')
									),
									lineStringFeature: f,
									tagIds: tagIds.length ? tagIds : undefined,
									data: buildImportData(uri, name, idx),
									custom_date: customDateDir,
								}))
							);
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

			if (!dryRun && overwriteMode !== 'create') {
				const existingIds = await queryExistingIdsBySourcePath(sourceFilePath);
				if (existingIds.length > 0) {
					if (overwriteMode === 'skip') {
						setImportResults([
							{
								name: filename,
								success: true,
								skipped: existingIds.length,
								skippedGeom: skippedCount > 0 ? skippedCount : undefined,
							},
						]);
						return;
					}
					overwrittenSingle = existingIds.length;
					await deleteLines(existingIds);
				}
			}

			if (dryRun) {
				setImportResults([
					{
						name: filename,
						success: true,
						importedCount: toImport.length,
						skippedGeom: skippedCount > 0 ? skippedCount : undefined,
					},
				]);
				return;
			}

			const tagIds = await buildDeriveTagIds(filename);
			const defaultTitle = filename.replace(/\.[^.]+$/, '');
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
						title: deriveTitle(filename, defaultTitle),
						lineStringFeature: merged,
						tagIds: tagIds.length ? tagIds : undefined,
						data: buildImportData(sourceFilePath, filename, null),
						custom_date: customDateSingle,
					},
				]);
			} else {
				const newLines = toImport.map((feature, idx) => ({
					title: deriveTitle(filename, feature.properties?.name ?? defaultTitle),
					lineStringFeature: feature,
					tagIds: tagIds.length ? tagIds : undefined,
					data: buildImportData(sourceFilePath, filename, idx),
					custom_date: customDateSingle,
				}));
				await createLines(newLines);
			}

			setImportResults([
				{
					name: filename,
					success: true,
					importedCount: mergeMode ? 1 : toImport.length,
					overwritten: overwrittenSingle > 0 ? overwrittenSingle : undefined,
					skippedGeom: skippedCount > 0 ? skippedCount : undefined,
				},
			]);
		},
		onSuccess: (_data, _vars) => {
			if (keepAppActive) bgTask.stop();
			invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);

			setStep('result');
		},
		onError: (err) => {
			if (keepAppActive) bgTask.stop();
			logError('ImportModal.import', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));

			if (importResultsRef.current.length > 0) {
				setStep('result');
			} else {
				setStep('preview');
			}
		},
	});

	return mutation;
};

export default useImportMutation;
