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
import { createLines } from '../../lines/db/actionsLine';
import { ensureTagByLabel } from '../../lines/db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries } from '../../lines/db/queryFns';
import { isValidGeometry, ImportMode, ImportFileResult, ImportStep, TagMode } from './types';

interface UseImportMutationParams {
	importMode: ImportMode;
	mergeMode: boolean;
	features: Feature<LineString, GeoJsonProperties>[];
	filename: string;
	sourceFilePath: string;
	selectedIndices: Set<number>;
	selectedFileUris: Set<string>;
	dirFiles: { uri: string; name: string }[];
	dismissedRef: React.MutableRefObject<boolean>;
	setStep: React.Dispatch<React.SetStateAction<ImportStep>>;
	setImportMode: React.Dispatch<React.SetStateAction<ImportMode>>;
	setFeatures: React.Dispatch<React.SetStateAction<Feature<LineString, GeoJsonProperties>[]>>;
	setFilename: React.Dispatch<React.SetStateAction<string>>;
	setSelectedIndices: React.Dispatch<React.SetStateAction<Set<number>>>;
	setDirFiles: React.Dispatch<React.SetStateAction<{ uri: string; name: string }[]>>;
	setSelectedFileUris: React.Dispatch<React.SetStateAction<Set<string>>>;
	setMergeMode: React.Dispatch<React.SetStateAction<boolean>>;
	setBulkProgress: React.Dispatch<React.SetStateAction<{ current: number; total: number }>>;
	setImportResults: React.Dispatch<React.SetStateAction<ImportFileResult[]>>;
	handleClose: () => void;
	fileLimit: number;
	titleRegex: string;
	tagMode: TagMode;
	selectedTagIds: number[];
	tagRegex: string;
	dryRun: boolean;
}

const useImportMutation = ({
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
	setImportMode,
	setFeatures,
	setFilename,
	setSelectedIndices,
	setDirFiles,
	setSelectedFileUris,
	setMergeMode,
	setBulkProgress,
	setImportResults,
	handleClose,
	fileLimit,
	titleRegex,
	tagMode,
	selectedTagIds,
	tagRegex,
	dryRun,
}: UseImportMutationParams) => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();
	const bgTask = useBackgroundTask('Importing routes');

	const importResultsRef = useRef<ImportFileResult[]>([]);
	const singleFileMeta = useRef<{ skippedGeom?: number }>({});
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
		[
			tagMode,
			selectedTagIds,
			tagRegex,
			getOrCreateImportTag,
		]
	);

	const mutation = useMutation({
		mutationFn: async () => {
			if (importMode === 'directory') {
				const uris = Array.from(selectedFileUris);
				const limitedUris = fileLimit > 0 ? uris.slice(0, fileLimit) : uris;
				const results: ImportFileResult[] = [];

				await bgTask.start(limitedUris.length);

				// Process each file independently — one failing file
				// doesn't block the rest.
				for (let i = 0; i < limitedUris.length; i++) {
					if (dismissedRef.current) {
						return;
					}
					setBulkProgress({ current: i + 1, total: limitedUris.length });
					const uri = limitedUris[i];
					const name = dirFiles.find((f) => f.uri === uri)?.name ?? uri.split('/').pop() ?? uri;
					bgTask.update(i + 1, name);
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
								}))
							);
							results.push({
								name,
								success: true,
								importedCount: created?.length ?? validFeatures.length,
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

			// ---- single-file mode ----
			let toImport = features.filter((_, idx) => selectedIndices.has(idx));
			const skippedCount = toImport.length - toImport.filter(isValidGeometry).length;
			toImport = toImport.filter(isValidGeometry);

			if (!toImport.length) {
				throw new Error(t('import.noFeatures'));
			}

			if (dryRun) {
				singleFileMeta.current.skippedGeom = skippedCount;
				return;
			}

			const tagIds = await buildDeriveTagIds(filename);
			const defaultTitle = filename.replace(/\.[^.]+$/, '');

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
					},
				]);
			} else {
				const newLines = toImport.map((feature, idx) => ({
					title: deriveTitle(filename, feature.properties?.name ?? defaultTitle),
					lineStringFeature: feature,
					tagIds: tagIds.length ? tagIds : undefined,
					data: buildImportData(sourceFilePath, filename, idx),
				}));
				await createLines(newLines);
			}

			// Store skipped geometry count for the success handler to show a
			// toast (single-file mode doesn't use the result screen).
			if (skippedCount > 0) {
				singleFileMeta.current.skippedGeom = skippedCount;
			}
		},
		onSuccess: (_data, _vars) => {
			bgTask.stop();
			invalidateLinesQueries(queryClient);
			invalidateTagsTable(queryClient);

			// For directory mode, show the result summary screen
			if (importMode === 'directory') {
				// Skip result screen if everything succeeded with no warnings
				const hasFailures = importResultsRef.current.some((r) => !r.success);
				const hasWarnings = importResultsRef.current.some(
					(r) => r.skippedGeom && r.skippedGeom > 0
				);
				if (hasFailures || hasWarnings) {
					setStep('result');
					return;
				}
			} else {
				// Single-file mode: warn about skipped geometry features
				const skipped = singleFileMeta.current.skippedGeom;
				if (skipped && skipped > 0) {
					showError(sprintf(t('import.skippedGeometry'), skipped));
				}
				delete singleFileMeta.current.skippedGeom;
			}

			setStep('idle');
			setImportMode('file');
			setFeatures([]);
			setFilename('');
			setSelectedIndices(new Set());
			setDirFiles([]);
			setSelectedFileUris(new Set());
			setMergeMode(false);
			setBulkProgress({ current: 0, total: 0 });
			setImportResults([]);
			handleClose();
		},
		onError: (err) => {
			bgTask.stop();
			delete singleFileMeta.current.skippedGeom;
			logError('ImportModal.import', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));

			// If we have per-file results (directory mode partial failure that
			// threw because all files failed), still show them
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
