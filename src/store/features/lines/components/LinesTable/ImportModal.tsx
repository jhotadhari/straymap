/**
 * External dependencies
 */
import { FC, useCallback, useContext, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, useTheme, Checkbox } from 'react-native-paper';
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
import { createTags } from '../../db/actionsTag';
import { dbConnection } from '../../../dbLoader/DBConnection';
import { tagsTable } from '../../db/schema/schema';

type ImportMode = 'file' | 'directory';

const ImportModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [step, setStep] = useState<'idle' | 'scanning' | 'parsing' | 'preview' | 'importing'>(
		'idle'
	);
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

	const [isPickingFile, runOpenDocument] = useAsyncBusy(openDocument);
	const [isPickingDir, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	// Track whether the modal has been dismissed so in-flight
	// async callbacks don't overwrite clean post-dismiss state.
	const dismissedRef = useRef(false);

	// ---- find or create an "imported" tag (shared) ----
	const getOrCreateImportTag = useCallback(async (): Promise<number | undefined> => {
		if (!dbConnection?.drizzle) return undefined;
		const existing = await dbConnection.drizzle
			.select({ id: tagsTable.id })
			.from(tagsTable)
			.where(eq(tagsTable.label, 'imported'))
			.limit(1);
		if (existing.length) {
			return existing[0].id;
		}
		const created = await createTags([
			{ label: 'imported', notes: null, data: null },
		]);
		return created?.length ? created[0].id : undefined;
	}, []);

	// ---- mutation ----
	const mutation = useMutation({
		mutationFn: async () => {
			let toImport: Feature<LineString, GeoJsonProperties>[];
			let titles: (string | undefined)[];

			if (importMode === 'directory') {
				// Parse each selected file and collect features
				const allFeatures: Feature<LineString, GeoJsonProperties>[] = [];
				const sourceNames: string[] = []; // track which file each feature came from
				const uris = Array.from(selectedFileUris);
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
							for (let f = 0; f < result.features.length; f++) {
								sourceNames.push(name.replace(/\.[^.]+$/, ''));
							}
							allFeatures.push(...result.features);
						}
					} catch (err) {
						logError('ImportModal.bulkParse', err);
						// Skip files that fail to parse; continue with remaining
					}
				}
				if (!allFeatures.length) {
					throw new Error(t('lines.importDirNoFiles'));
				}
				toImport = allFeatures;
				titles = allFeatures.map((f, i) => f.properties?.name ?? sourceNames[i]);
			} else {
				toImport = features.filter((_, idx) => selectedIndices.has(idx));
				titles = toImport.map(
					(f) => f.properties?.name ?? filename.replace(/\.[^.]+$/, '')
				);
			}

			if (!toImport.length) {
				throw new Error(
					importMode === 'directory'
						? t('lines.importDirNoFiles')
						: t('lines.importNoFeatures')
				);
			}

			const importTagId = await getOrCreateImportTag();

			if (mergeMode) {
				// Merge all features into a single LineString
				const allCoords = toImport.flatMap((f) => f.geometry.coordinates);
				const merged: Feature<LineString, GeoJsonProperties> = {
					type: 'Feature',
					properties: {},
					geometry: { type: 'LineString', coordinates: allCoords },
				};
				const title =
					importMode === 'file'
						? filename.replace(/\.[^.]+$/, '')
						: (dirFiles
								.find((f) => f.uri === Array.from(selectedFileUris).sort()[0])
								?.name?.replace(/\.[^.]+$/, '') ??
							t('lines.importTrackN', { ns: 'lines' }));
				await createLines([
					{
						title,
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
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			setStep('idle');
			setImportMode('file');
			setFeatures([]);
			setFilename('');
			setSelectedIndices(new Set());
			setDirFiles([]);
			setSelectedFileUris(new Set());
			setMergeMode(false);
			setBulkProgress({ current: 0, total: 0 });
			onDismiss();
		},
		onError: (err) => {
			logError('ImportModal.import', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
			setStep('preview');
		},
	});

	// ---- single-file pick ----
	const handlePickFile = useCallback(async () => {
		try {
			const file = await runOpenDocument(false);
			if (!file?.uri || dismissedRef.current) return;

			setImportMode('file');
			setDirFiles([]);
			setSelectedFileUris(new Set());
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
		mutation.mutate();
	}, [selectionCount, mutation]);

	// ====== RENDER ======

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={t('lines.importTitle')}
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
});

export default ImportModal;
