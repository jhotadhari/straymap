/**
 * External dependencies
 */
import { useCallback, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { readFile } from 'react-native-fs';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';
import { useContext } from 'react';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../components/ErrorToast/Context';
import { logError } from '../../../../lib/utils';
import { detectImportFormat, parseImportContent } from '../../utils/importParser';
import { createLines } from '../../db/actionsLine';
import { ensureTagByLabel } from '../../db/actionsTag';
import { invalidateTagsTable, invalidateLinesQueries } from '../../db/queryFns';
import { isValidGeometry, ImportMode, ImportFileResult, ImportStep } from './types';

interface UseImportMutationParams {
	importMode: ImportMode;
	mergeMode: boolean;
	features: Feature<LineString, GeoJsonProperties>[];
	filename: string;
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
	handleDismissModal: () => void;
}

const useImportMutation = ({
	importMode,
	mergeMode,
	features,
	filename,
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
	handleDismissModal,
}: UseImportMutationParams) => {
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const importResultsRef = useRef<ImportFileResult[]>([]);
	const singleFileMeta = useRef<{ skippedGeom?: number }>({});

	const getOrCreateImportTag = useCallback(async (): Promise<number | undefined> => {
		return ensureTagByLabel('imported');
	}, []);

	const mutation = useMutation({
		mutationFn: async () => {
			if (importMode === 'directory') {
				const importTagId = await getOrCreateImportTag();
				const uris = Array.from(selectedFileUris);
				const results: ImportFileResult[] = [];

				// Process each file independently — one failing file
				// doesn't block the rest.
				for (let i = 0; i < uris.length; i++) {
					if (dismissedRef.current) return;
					setBulkProgress({ current: i + 1, total: uris.length });
					const uri = uris[i];
					const name = dirFiles.find((f) => f.uri === uri)?.name ?? uri;
					try {
						const content = await readFile(uri, 'utf8');
						const format = detectImportFormat(name);
						if (!format) {
							results.push({
								name,
								success: false,
								error: sprintf(
									t('lines.importUnsupportedFormat'),
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
								error: t('lines.importNoFeatures'),
								skippedGeom: skippedGeom > 0 ? skippedGeom : undefined,
							});
							continue;
						}

						try {
							const created = await createLines(
								validFeatures.map((f, idx) => ({
									title:
										f.properties?.name ??
										name.replace(/\.[^.]+$/, '') +
											(validFeatures.length > 1 ? ` ${idx + 1}` : ''),
									lineStringFeature: f,
									tagIds: importTagId ? [importTagId] : undefined,
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
						results.length > 0
							? t('lines.importResultAllFailed')
							: t('lines.importDirNoFiles')
					);
				}
				return;
			}

			// ---- single-file mode ----
			let toImport = features.filter((_, idx) => selectedIndices.has(idx));
			const skippedCount = toImport.length - toImport.filter(isValidGeometry).length;
			toImport = toImport.filter(isValidGeometry);

			if (!toImport.length) {
				throw new Error(t('lines.importNoFeatures'));
			}

			const importTagId = await getOrCreateImportTag();
			const titles = toImport.map(
				(f) => f.properties?.name ?? filename.replace(/\.[^.]+$/, '')
			);

			if (mergeMode) {
				const allCoords = toImport.flatMap((f) => f.geometry.coordinates);
				const merged: Feature<LineString, GeoJsonProperties> = {
					type: 'Feature',
					properties: {},
					geometry: { type: 'LineString', coordinates: allCoords },
				};
				await createLines([
					{
						title: filename.replace(/\.[^.]+$/, ''),
						lineStringFeature: merged,
						tagIds: importTagId ? [importTagId] : undefined,
					},
				]);
			} else {
				const newLines = toImport.map((feature, idx) => ({
					title: titles[idx],
					lineStringFeature: feature,
					tagIds: importTagId ? [importTagId] : undefined,
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
			}

			// Single-file mode: warn about skipped geometry features
			const skipped = singleFileMeta.current.skippedGeom;
			if (skipped && skipped > 0) {
				showError(sprintf(t('lines.importSkippedGeometry'), skipped));
			}
			delete singleFileMeta.current.skippedGeom;

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
			handleDismissModal();
		},
		onError: (err) => {
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
