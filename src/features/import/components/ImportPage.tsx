/**
 * External dependencies
 */
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { openDocument, openDocumentTree, listFiles } from 'react-native-scoped-storage';
import { readFile } from 'react-native-fs';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { logError } from '../../../lib/utils';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import useAsyncBusy from '../../../compose/useAsyncBusy';
import { detectImportFormat, parseImportContent, IMPORT_EXTENSIONS } from '../../lines/utils/importParser';
import { useButtonProps } from '../../../compose/useButtonProps';
import useDirsInfo from '../../dirs/hooks/useDirsInfo';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { selectUiItemKeys } from '../../ui/selectors';
import { setUiItemKeys } from '../../ui/slice';
import { localStyles } from './styles';
import { ImportMode, ImportFileResult, ImportStep, TagMode } from './types';
import useImportMutation from './useImportMutation';
import StepIdle from './StepIdle';
import StepPreview from './StepPreview';
import StepResult from './StepResult';
import { AbsPath } from '../../dirs/types';

const ImportPage = () => {
	const dispatch = useAppDispatch();
	const uiItemsKeys = useAppSelector(selectUiItemKeys);

	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

	const handleClose = useCallback(() => {
		dispatch(setUiItemKeys(uiItemsKeys.slice(0, Math.max(0, uiItemsKeys.length - 1))));
	}, [dispatch, uiItemsKeys]);

	const [step, setStep] = useState<ImportStep>('idle');
	const [importMode, setImportMode] = useState<ImportMode>('file');

	// Single-file state
	const [features, setFeatures] = useState<Feature<LineString, GeoJsonProperties>[]>([]);
	const [filename, setFilename] = useState('');
	const [sourceFilePath, setSourceFilePath] = useState('');
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

	// Directory state
	const [dirFiles, setDirFiles] = useState<{ uri: string; name: string }[]>([]);
	const [selectedFileUris, setSelectedFileUris] = useState<Set<string>>(new Set());

	// Shared
	const [mergeMode, setMergeMode] = useState(false);
	const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
	const [importResults, setImportResults] = useState<ImportFileResult[]>([]);

	// Import config
	const [fileLimit, setFileLimit] = useState<number>(0);
	const [titleRegex, setTitleRegex] = useState('');
	const [tagMode, setTagMode] = useState<TagMode>('none');
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);
	const [tagRegex, setTagRegex] = useState('');
	const [dryRun, setDryRun] = useState(false);

	// Storage directory scanning (fast native FsModule)
	const [storagePath, setStoragePath] = useState<AbsPath | ''>('');
	const { dirsInfo, isLoading: isScanningStorage } = useDirsInfo({
		navDirs: storagePath ? [storagePath as AbsPath] : [],
		extensions: [...IMPORT_EXTENSIONS] as string[],
		recursive: true,
	});

	const handleScanStorage = useCallback(
		(path: string) => {
			if (!path.startsWith('/')) {
				showError(sprintf(t('errorGeneric'), 'Path must start with /'));
				return;
			}
			setImportMode('directory');
			setStoragePath(path as AbsPath);
			setStep('scanning');
		},
		[showError, t]
	);

	useEffect(() => {
		if (!storagePath || !dirsInfo || isScanningStorage) return;
		const dirKey = Object.keys(dirsInfo)[0];
		if (!dirKey || !dirsInfo[dirKey]?.navChildren) return;

		const children = dirsInfo[dirKey].navChildren!.filter(
			(c) => c.isFile && c.canRead
		);
		setDirFiles(children.map((c) => ({ uri: c.name, name: c.name.split('/').pop() ?? c.name })));
		setSelectedFileUris(new Set(children.map((c) => c.name)));
		setMergeMode(false);
		setStoragePath('');
		setStep('preview');
	}, [storagePath, dirsInfo, isScanningStorage]);

	const [isPickingFile, runOpenDocument] = useAsyncBusy(openDocument);
	const [isPickingDir, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	// Track whether the page has been dismissed so in-flight
	// async callbacks don't overwrite clean post-dismiss state.
	const dismissedRef = useRef(false);

	// ---- import mutation ----
	const mutation = useImportMutation({
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
	});

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
			setSourceFilePath(file.uri);

			const format = detectImportFormat(name);
			if (!format) {
				if (dismissedRef.current) return;
				showError(sprintf(t('import.unsupportedFormat'), name.split('.').pop() ?? ''));
				setStep('idle');
				return;
			}

			const content = await readFile(file.uri, 'utf8');
			if (dismissedRef.current) return;
			const result = parseImportContent(content, format);

			if (!result.features.length) {
				if (dismissedRef.current) return;
				showError(t('import.noFeatures'));
				setStep('idle');
				return;
			}

			if (dismissedRef.current) return;
			setFeatures(result.features);
			setSelectedIndices(new Set(result.features.map((_, i) => i)));
			setMergeMode(false);
			setStep('preview');
		} catch (err) {
			logError('ImportPage.handlePickFile', err);
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
			setSourceFilePath('');
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
				showError(t('import.dirNoFiles'));
				setStep('idle');
				return;
			}

			if (dismissedRef.current) return;
			setDirFiles(supported);
			setSelectedFileUris(new Set(supported.map((f) => f.uri)));
			setMergeMode(false);
			setStep('preview');
		} catch (err) {
			logError('ImportPage.handlePickDirectory', err);
			showError(sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err)));
			setStep('idle');
		}
	}, [
		runOpenDocumentTree,
		showError,
		t,
	]);


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
		setSourceFilePath('');
		setSelectedIndices(new Set());
		setDirFiles([]);
		setSelectedFileUris(new Set());
		setMergeMode(false);
		setBulkProgress({ current: 0, total: 0 });
		setImportResults([]);
		handleClose();
	}, [handleClose]);

	// ---- button props ----
	const buttonPropsIdle = useButtonProps({
		disabled: isPickingFile || isPickingDir,
	});

	const buttonPropsImport = useButtonProps({
		disabled: selectionCount === 0,
	});

	// ====== RENDER ======
	return (
		<View style={[localStyles.modalInner]}>
			{step === 'idle' && (
				<StepIdle
					handlePickFile={handlePickFile}
					handlePickDirectory={handlePickDirectory}
					handleScanStorage={handleScanStorage}
					proposedPath={null}
					buttonPropsIdle={buttonPropsIdle as Record<string, unknown>}
				/>
			)}

			{step === 'scanning' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('import.scanningDir')}</Text>
				</View>
			)}

			{step === 'parsing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('import.parsing')}</Text>
				</View>
			)}

			{step === 'preview' && (
				<StepPreview
					importMode={importMode}
					features={features}
					filename={filename}
					selectedIndices={selectedIndices}
					dirFiles={dirFiles}
					selectedFileUris={selectedFileUris}
					mergeMode={mergeMode}
					onToggleMergeMode={() => setMergeMode((prev) => !prev)}
					selectionCount={selectionCount}
					handleToggleFeature={handleToggleFeature}
					handleSelectAllFeatures={handleSelectAllFeatures}
					handleDeselectAllFeatures={handleDeselectAllFeatures}
					handleToggleFile={handleToggleFile}
					handleSelectAllFiles={handleSelectAllFiles}
					handleDeselectAllFiles={handleDeselectAllFiles}
					handleImport={handleImport}
					buttonPropsImport={buttonPropsImport}
					fileLimit={fileLimit}
					setFileLimit={setFileLimit}
					titleRegex={titleRegex}
					setTitleRegex={setTitleRegex}
					tagMode={tagMode}
					setTagMode={setTagMode}
					tagRegex={tagRegex}
					setTagRegex={setTagRegex}
					selectedTagIds={selectedTagIds}
					setSelectedTagIds={setSelectedTagIds}
					dryRun={dryRun}
					setDryRun={setDryRun}
				/>
			)}

			{step === 'importing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					{importMode === 'directory' && bulkProgress.total > 0 ? (
						<Text>
							{sprintf(
								t('import.progress'),
								bulkProgress.current,
								bulkProgress.total
							)}
						</Text>
					) : (
						<Text>{t('import.importing')}</Text>
					)}
				</View>
			)}

			{step === 'result' && (
				<StepResult
					importResults={importResults}
					handleResultDone={handleResultDone}
				/>
			)}
		</View>
	);
};

export default ImportPage;
