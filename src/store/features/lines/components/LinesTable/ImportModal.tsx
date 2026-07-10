/**
 * External dependencies
 */
import { FC, useCallback, useContext, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme, Checkbox, Icon } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { eq } from 'drizzle-orm';
import { get } from 'lodash-es';
import { openDocument, openDocumentTree, listFiles } from 'react-native-scoped-storage';
import { readFile } from 'react-native-fs';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../../../components/ErrorToast/Context';
import { logError } from '../../../../../lib/utils';
import ButtonHighlight from '../../../../../components/generic/ButtonHighlight';
import ModalWrapper from '../../../../../components/generic/ModalWrapper';
import LoadingIndicator from '../../../../../components/generic/LoadingIndicator';
import useAsyncBusy from '../../../../../compose/useAsyncBusy';
import {
	detectImportFormat,
	parseImportContent,
	IMPORT_EXTENSIONS,
} from '../../utils/importParser';
import { createLines } from '../../db/actionsLine';
import { createTags, ensureTagByLabel } from '../../db/actionsTag';
import { invalidateTagsTable } from '../../db/queryFns';
import { dbConnection } from '../../../dbLoader/DBConnection';
import { tagsTable } from '../../db/schema/schema';

type ImportMode = 'file' | 'directory';

type ImportFileResult = {
	name: string;
	success: boolean;
	error?: string;
	skippedGeom?: number;
	importedCount?: number;
};

const isValidGeometry = (feature: Feature<LineString, GeoJsonProperties>): boolean => {
	const geom = feature?.geometry;
	if (!geom || geom.type !== 'LineString') return false;
	const coords = geom.coordinates;
	if (!Array.isArray(coords) || coords.length < 2) return false;
	return coords.every(
		(c) =>
			Array.isArray(c) &&
			c.length >= 2 &&
			typeof c[0] === 'number' &&
			typeof c[1] === 'number'
	);
};

const ImportModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [step, setStep] = useState<
		'idle' | 'scanning' | 'parsing' | 'preview' | 'importing' | 'result'
	>('idle');
	const [importMode, setImportMode] = useState<ImportMode>('file');

	// Single-file state
	const [features, setFeatures] = useState<Feature<LineString, GeoJsonProperties>[]>([]);
	const [filename, setFilename] = useState('');
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

	// Directory state
	const [dirFiles, setDirFiles] = useState<{ uri: string; name: string }[]>([]);
	const [selectedFileUris, setSelectedFileUris] = useState<Set<string>>(new Set());

	// Shared
	const [mergeMode, setMergeMode] = useState(false);
	const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
	const [importResults, setImportResults] = useState<ImportFileResult[]>([]);
	const importResultsRef = useRef<ImportFileResult[]>([]);

	const [isPickingFile, runOpenDocument] = useAsyncBusy(openDocument);
	const [isPickingDir, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	// Track whether the modal has been dismissed so in-flight
	// async callbacks don't overwrite clean post-dismiss state.
	const dismissedRef = useRef(false);

	// ---- find or create an "imported" tag (shared) ----
	const getOrCreateImportTag = useCallback(async (): Promise<number | undefined> => {
		return ensureTagByLabel('imported');
	}, []);

	// ---- mutation ----
	const mutation = useMutation({
		mutationFn: async () => {
			if (importMode === 'directory') {
				const importTagId = await getOrCreateImportTag();
				const uris = Array.from(selectedFileUris);
				const results: ImportFileResult[] = [];

				if (mergeMode) {
					// Merge mode: collect all features from all files, validate
					// geometry, then create a single merged line.  All-or-nothing
					// since the output is one line.
					const allFeatures: Feature<LineString, GeoJsonProperties>[] = [];
					for (let i = 0; i < uris.length; i++) {
						if (dismissedRef.current) return;
						setBulkProgress({ current: i + 1, total: uris.length });
						const uri = uris[i];
						const name = dirFiles.find((f) => f.uri === uri)?.name ?? uri;
						try {
							const content = await readFile(uri, 'utf8');
							const format = detectImportFormat(name);
							if (format) {
								const result = parseImportContent(content, format);
								const valid = result.features.filter(isValidGeometry);
								allFeatures.push(...valid);
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
					if (!allFeatures.length) {
						setImportResults(results);
						importResultsRef.current = results;
						throw new Error(
							results.length > 0
								? t('lines.importResultAllFailed')
								: t('lines.importDirNoFiles')
						);
					}
					const allCoords = allFeatures.flatMap((f) => f.geometry.coordinates);
					const merged: Feature<LineString, GeoJsonProperties> = {
						type: 'Feature',
						properties: {},
						geometry: { type: 'LineString', coordinates: allCoords },
					};
					const title =
						dirFiles
							.find((f) => f.uri === Array.from(selectedFileUris).sort()[0])
							?.name?.replace(/\.[^.]+$/, '') ??
						t('lines.importTrackN', { ns: 'lines' });
					await createLines([
						{
							title,
							lineStringFeature: merged,
							tagIds: importTagId ? [importTagId] : undefined,
						},
					]);
					setImportResults(results);
				} else {
					// Non-merge mode: process each file independently so one
					// failing file doesn't block the rest.
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
			queryClient.invalidateQueries({ queryKey: ['lines'] });
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
			onDismiss();
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

	// Mutable scratch-pad for passing metadata from mutationFn to onSuccess
	// without adding component state that triggers re-renders mid-mutation.
	const singleFileMeta = useRef<{ skippedGeom?: number }>({});

	// ---- single-file pick ----
	const handlePickFile = useCallback(async () => {
		try {
			const file = await runOpenDocument(false);
			if (!file?.uri || dismissedRef.current) return;

			setImportMode('file');
			setDirFiles([]);
			setSelectedFileUris(new Set());
			setImportResults([]);
			setStep('parsing');
			const name = file.name ?? file.uri.split('/').pop() ?? '';
			setFilename(name);

			const format = detectImportFormat(name);
			if (!format) {
				if (dismissedRef.current) return;
				showError(sprintf(t('lines.importUnsupportedFormat'), name.split('.').pop() ?? ''));
				setStep('idle');
				return;
			}

			const content = await readFile(file.uri, 'utf8');
			if (dismissedRef.current) return;
			const result = parseImportContent(content, format);

			if (!result.features.length) {
				if (dismissedRef.current) return;
				showError(t('lines.importNoFeatures'));
				setStep('idle');
				return;
			}

			if (dismissedRef.current) return;
			setFeatures(result.features);
			setSelectedIndices(new Set(result.features.map((_, i) => i)));
			setMergeMode(false);
			setStep('preview');
		} catch (err) {
			logError('ImportModal.handlePickFile', err);
			if (dismissedRef.current) return;
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
			setStep('idle');
		}
	}, [
		runOpenDocument,
		showError,
		t,
	]);

	// ---- directory pick ----
	const handlePickDirectory = useCallback(async () => {
		try {
			const dir = await runOpenDocumentTree(true);
			if (!dir?.uri || dismissedRef.current) return;

			setImportMode('directory');
			setFeatures([]);
			setFilename('');
			setSelectedIndices(new Set());
			setImportResults([]);
			setStep('scanning');

			const items = await listFiles(dir.uri);
			if (dismissedRef.current) return;

			const supported = items
				.filter((item) => {
					if (item.type !== 'file') return false;
					const ext = item.name.split('.').pop()?.toLowerCase();
					return ext ? (IMPORT_EXTENSIONS as readonly string[]).includes(ext) : false;
				})
				.map((item) => ({ uri: item.uri, name: item.name }));

			if (!supported.length) {
				if (dismissedRef.current) return;
				showError(t('lines.importDirNoFiles'));
				setStep('idle');
				return;
			}

			if (dismissedRef.current) return;
			setDirFiles(supported);
			setSelectedFileUris(new Set(supported.map((f) => f.uri)));
			setMergeMode(false);
			setStep('preview');
		} catch (err) {
			logError('ImportModal.handlePickDirectory', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
			setStep('idle');
		}
	}, [
		runOpenDocumentTree,
		showError,
		t,
	]);

	// ---- dismiss handling ----
	const handleDismiss = useCallback(() => {
		dismissedRef.current = true;
		if (step === 'importing') return;
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
		onDismiss();
	}, [onDismiss, step]);

	// Reset the dismissed guard when the modal becomes visible again
	const prevVisibleRef = useRef(false);
	if (visible && !prevVisibleRef.current) {
		dismissedRef.current = false;
	}
	prevVisibleRef.current = visible;

	// ---- feature checkbox toggles (single-file mode) ----
	const handleToggleFeature = useCallback((idx: number) => {
		setSelectedIndices((prev) => {
			const next = new Set(prev);
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
			return next;
		});
	}, []);

	const handleSelectAllFeatures = useCallback(() => {
		setSelectedIndices(new Set(features.map((_, i) => i)));
	}, [features]);

	const handleDeselectAllFeatures = useCallback(() => {
		setSelectedIndices(new Set());
	}, []);

	// ---- file checkbox toggles (directory mode) ----
	const handleToggleFile = useCallback((uri: string) => {
		setSelectedFileUris((prev) => {
			const next = new Set(prev);
			if (next.has(uri)) next.delete(uri);
			else next.add(uri);
			return next;
		});
	}, []);

	const handleSelectAllFiles = useCallback(() => {
		setSelectedFileUris(new Set(dirFiles.map((f) => f.uri)));
	}, [dirFiles]);

	const handleDeselectAllFiles = useCallback(() => {
		setSelectedFileUris(new Set());
	}, []);

	// ---- import button ----
	const selectionCount =
		importMode === 'directory' ? selectedFileUris.size : selectedIndices.size;

	const handleImport = useCallback(() => {
		if (!selectionCount) return;
		setStep('importing');
		setImportResults([]);
		mutation.mutate();
	}, [selectionCount, mutation]);

	// ---- result screen dismiss ----
	const handleResultDone = useCallback(() => {
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
		onDismiss();
	}, [onDismiss]);

	// ====== RENDER ======

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={step === 'result' ? t('lines.importResultTitle') : t('lines.importTitle')}
			innerStyle={localStyles.modalInner}
		>
			{/* ---- idle ---- */}
			{step === 'idle' && (
				<View style={localStyles.idleContainer}>
					<Text style={localStyles.hint}>
						{t('lines.importHint', {
							extensions: IMPORT_EXTENSIONS.join(', '),
						})}
					</Text>

					<ButtonHighlight
						onPress={handlePickFile}
						mode="contained"
						disabled={isPickingFile || isPickingDir}
						buttonColor={get(theme.colors, 'primaryContainer')}
						textColor={get(theme.colors, 'onPrimaryContainer')}
					>
						<Text>{t('lines.importPickFile')}</Text>
					</ButtonHighlight>

					<ButtonHighlight
						onPress={handlePickDirectory}
						mode="contained"
						disabled={isPickingFile || isPickingDir}
						buttonColor={get(theme.colors, 'secondaryContainer')}
						textColor={get(theme.colors, 'onSecondaryContainer')}
					>
						<Text>{t('lines.importPickDirectory')}</Text>
					</ButtonHighlight>
				</View>
			)}

			{/* ---- scanning directory ---- */}
			{step === 'scanning' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('lines.importScanningDir')}</Text>
				</View>
			)}

			{/* ---- parsing single file ---- */}
			{step === 'parsing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('lines.importParsing')}</Text>
				</View>
			)}

			{/* ---- preview ---- */}
			{step === 'preview' && (
				<View>
					{importMode === 'file' ? (
						/* ---- single-file feature preview ---- */
						<>
							<Text style={localStyles.filename}>{filename}</Text>
							<Text style={localStyles.featureCount}>
								{sprintf(t('lines.importFeatureCount'), features.length)}
							</Text>

							<View style={localStyles.selectRow}>
								<ButtonHighlight
									mode="text"
									compact
									onPress={handleSelectAllFeatures}
								>
									<Text>{t('lines.selectAll')}</Text>
								</ButtonHighlight>
								<ButtonHighlight
									mode="text"
									compact
									onPress={handleDeselectAllFeatures}
								>
									<Text>{t('lines.selectNone')}</Text>
								</ButtonHighlight>
							</View>

							<ScrollView
								style={localStyles.featureList}
								horizontal={false}
							>
								{features.map((feature, idx) => (
									<View
										key={idx}
										style={[
											localStyles.featureRow,
											{ borderColor: theme.colors.outline },
										]}
									>
										<Checkbox
											status={
												selectedIndices.has(idx) ? 'checked' : 'unchecked'
											}
											onPress={() => handleToggleFeature(idx)}
										/>
										<Text>
											{feature.properties?.name ??
												sprintf(t('lines.importTrackN'), idx + 1)}
										</Text>
									</View>
								))}
							</ScrollView>
						</>
					) : (
						/* ---- directory file preview ---- */
						<>
							<Text style={localStyles.featureCount}>
								{sprintf(t('lines.importDirFilesFound'), dirFiles.length)}
							</Text>

							<View style={localStyles.selectRow}>
								<ButtonHighlight
									mode="text"
									compact
									onPress={handleSelectAllFiles}
								>
									<Text>{t('lines.selectAll')}</Text>
								</ButtonHighlight>
								<ButtonHighlight
									mode="text"
									compact
									onPress={handleDeselectAllFiles}
								>
									<Text>{t('lines.selectNone')}</Text>
								</ButtonHighlight>
							</View>

							<ScrollView
								style={localStyles.featureList}
								horizontal={false}
							>
								{dirFiles.map((file) => (
									<View
										key={file.uri}
										style={[
											localStyles.featureRow,
											{ borderColor: theme.colors.outline },
										]}
									>
										<Checkbox
											status={
												selectedFileUris.has(file.uri)
													? 'checked'
													: 'unchecked'
											}
											onPress={() => handleToggleFile(file.uri)}
										/>
										<Text>{file.name}</Text>
									</View>
								))}
							</ScrollView>
						</>
					)}

					{/* ---- merge mode toggle (shown for both modes) ---- */}
					<View
						style={[
							localStyles.featureRow,
							localStyles.mergeToggle,
							{ borderColor: theme.colors.outline },
						]}
					>
						<Checkbox
							status={mergeMode ? 'checked' : 'unchecked'}
							onPress={() => setMergeMode((prev) => !prev)}
						/>
						<Text>{t('lines.importMergeMode')}</Text>
					</View>

					{/* ---- import button ---- */}
					<View style={localStyles.importControls}>
						<ButtonHighlight
							onPress={handleImport}
							mode="contained"
							disabled={selectionCount === 0}
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>{sprintf(t('lines.importSelected'), selectionCount)}</Text>
						</ButtonHighlight>
					</View>
				</View>
			)}

			{/* ---- importing ---- */}
			{step === 'importing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					{importMode === 'directory' && bulkProgress.total > 0 ? (
						<Text>
							{sprintf(
								t('lines.importProgress'),
								bulkProgress.current,
								bulkProgress.total
							)}
						</Text>
					) : (
						<Text>{t('lines.importing')}</Text>
					)}
				</View>
			)}

			{/* ---- result summary ---- */}
			{step === 'result' && (
				<View>
					<Text style={localStyles.resultSummary}>
						{sprintf(
							t('lines.importResultPartialSummary'),
							importResults.filter((r) => r.success).length,
							importResults.length
						)}
					</Text>

					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{importResults.map((result, idx) => (
							<View
								key={idx}
								style={[
									localStyles.resultRow,
									{ borderColor: theme.colors.outline },
								]}
							>
								<Icon
									source={result.success ? 'check-circle' : 'alert-circle'}
									size={20}
									color={
										result.success ? theme.colors.primary : theme.colors.error
									}
								/>
								<View style={localStyles.resultTextCol}>
									<Text style={localStyles.resultFileName}>{result.name}</Text>
									{result.success ? (
										<Text style={localStyles.resultDetail}>
											{sprintf(
												t('lines.importResultSuccess'),
												result.importedCount ?? 0
											)}
										</Text>
									) : (
										<Text
											style={[
												localStyles.resultDetail,
												{ color: theme.colors.error },
											]}
										>
											{sprintf(
												t('lines.importResultFailed'),
												result.error ?? ''
											)}
										</Text>
									)}
									{result.skippedGeom && result.skippedGeom > 0 && (
										<Text
											style={[
												localStyles.resultDetail,
												{ color: theme.colors.tertiary },
											]}
										>
											{sprintf(
												t('lines.importResultSkippedGeom'),
												result.skippedGeom
											)}
										</Text>
									)}
								</View>
							</View>
						))}
					</ScrollView>

					<View style={localStyles.importControls}>
						<ButtonHighlight
							onPress={handleResultDone}
							mode="contained"
							buttonColor={get(theme.colors, 'primaryContainer')}
							textColor={get(theme.colors, 'onPrimaryContainer')}
						>
							<Text>{t('lines.importDone')}</Text>
						</ButtonHighlight>
					</View>
				</View>
			)}
		</ModalWrapper>
	);
};

const localStyles = StyleSheet.create({
	modalInner: {
		gap: 16,
		marginTop: 16,
	},
	idleContainer: {
		gap: 24,
		alignItems: 'center',
		paddingVertical: 16,
	},
	hint: {
		textAlign: 'center',
		opacity: 0.7,
	},
	centered: {
		alignItems: 'center',
		gap: 12,
		paddingVertical: 24,
	},
	filename: {
		fontWeight: 'bold',
		marginBottom: 4,
	},
	featureCount: {
		opacity: 0.7,
		marginBottom: 8,
	},
	selectRow: {
		flexDirection: 'row',
		gap: 8,
		marginBottom: 8,
	},
	featureList: {
		maxHeight: 300,
		marginBottom: 8,
	},
	featureRow: {
		flexDirection: 'row',
		alignItems: 'center',
		borderBottomWidth: 1,
		paddingVertical: 4,
	},
	mergeToggle: {
		marginTop: 8,
	},
	importControls: {
		marginTop: 12,
	},
	resultSummary: {
		fontWeight: 'bold',
		marginBottom: 8,
	},
	resultRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 8,
		borderBottomWidth: 1,
		paddingVertical: 8,
	},
	resultTextCol: {
		flex: 1,
		flexDirection: 'column',
		gap: 2,
	},
	resultFileName: {
		fontWeight: 'bold',
	},
	resultDetail: {
		opacity: 0.8,
		fontSize: 12,
	},
});

export default ImportModal;
