/**
 * External dependencies
 */
import { memo, MutableRefObject, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { openDocument, openDocumentTree, listFiles } from 'react-native-scoped-storage';
import { readFile } from 'react-native-fs';
import { sprintf } from 'sprintf-js';
import { Feature, GeoJsonProperties, LineString } from 'geojson';
import { UseMutationResult } from '@tanstack/react-query';
import get from 'lodash/get';

/**
 * Internal dependencies
 */
import { ErrorToastContext } from '../../../components/ErrorToast/Context';
import { logError } from '../../../lib/utils';
import LoadingIndicator from '../../../components/generic/primitives/LoadingIndicator';
import useAsyncBusy from '../../../compose/useAsyncBusy';
import { detectImportFormat, parseImportContent, IMPORT_EXTENSIONS } from '../../lines/utils/importParser';
import useDirsInfo from '../../dirs/hooks/useDirsInfo';
import { useAppSelector } from '../../../store/hooks';
import { selectAppDirs } from '../../dirs/selectors';
import { localStyles } from './styles';
import { ImportMode, ImportFileResult, ImportStep } from './types';
import { AbsPath } from '../../dirs/types';
import { ImportContextProvider } from './ImportContext';
import useImportMutation from './useImportMutation';
import StepIdle from './StepIdle';
import StepPreview from './StepPreview';
import StepResult from './StepResult';

const MutationBootstrap = ({
	mutationRef,
}: {
	mutationRef: MutableRefObject<UseMutationResult<void, Error, void, unknown> | null>;
}) => {
	const mutation = useImportMutation();
	mutationRef.current = mutation;
	return null;
};

const ImportPage = () => {
	const appDirs = useAppSelector(selectAppDirs);
	const importDirs = useMemo(() => get(appDirs, 'import', []) as AbsPath[], [appDirs]);

	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);

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
	const [bulkProgress, setBulkProgress] = useState({ current: 0, total: 0 });
	const [importResults, setImportResults] = useState<ImportFileResult[]>([]);

	// Import config (persisted in Redux slice)
	const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

	// Storage directory scanning
	const [storagePath, setStoragePath] = useState<AbsPath | ''>('');
	const { dirsInfo, isLoading: isScanningStorage } = useDirsInfo({
		navDirs: storagePath ? [storagePath as AbsPath] : [],
		extensions: [...IMPORT_EXTENSIONS] as string[],
		recursive: true,
	});

	const handleSelectAppDir = useCallback(
		(path: AbsPath) => {
			setImportMode('directory');
			setStoragePath(path);
			setStep('scanning');
		},
		[]
	);

	useEffect(() => {
		if (dismissedRef.current) return;
		if (!storagePath || !dirsInfo || isScanningStorage) return;
		const dirKey = Object.keys(dirsInfo)[0];
		if (!dirKey || !dirsInfo[dirKey]?.navChildren) return;

		const children = dirsInfo[dirKey].navChildren!.filter(
			(c) => c.isFile && c.canRead
		);
		setDirFiles(children.map((c) => ({ uri: c.name, name: c.name.split('/').pop() ?? c.name })));
		setSelectedFileUris(new Set(children.map((c) => c.name)));
		setStoragePath('');
		setStep('preview');
	}, [storagePath, dirsInfo, isScanningStorage]);

	const [_isPickingFile, runOpenDocument] = useAsyncBusy(openDocument);
	const [_isPickingDir, runOpenDocumentTree] = useAsyncBusy(openDocumentTree);

	const dismissedRef = useRef(false);
	useEffect(() => {
		return () => {
			dismissedRef.current = true;
		};
	}, []);

	const mutationRef = useRef<UseMutationResult<void, Error, void, unknown> | null>(null);

	const handleImport = useCallback(() => {
		const selectionCount =
			importMode === 'directory' ? selectedFileUris.size : selectedIndices.size;
		if (!selectionCount) return;
		setStep('importing');
		setImportResults([]);
		mutationRef.current?.mutate();
	}, [importMode, selectedFileUris.size, selectedIndices.size]);

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

	const handleSelectCustom = useCallback(async () => {
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

	const handleResultDone = useCallback(() => {
		setStep('idle');
		setImportMode('file');
		setFeatures([]);
		setFilename('');
		setSourceFilePath('');
		setSelectedIndices(new Set());
		setDirFiles([]);
		setSelectedFileUris(new Set());
		setBulkProgress({ current: 0, total: 0 });
		setImportResults([]);
	}, []);

	const selectionCount =
		importMode === 'directory' ? selectedFileUris.size : selectedIndices.size;

	const ctxValue = useMemo(
		() => ({
			step,
			setStep,
			importMode,
			setImportMode,
			features,
			setFeatures,
			filename,
			setFilename,
			sourceFilePath,
			setSourceFilePath,
			selectedIndices,
			setSelectedIndices,
			dirFiles,
			setDirFiles,
			selectedFileUris,
			setSelectedFileUris,
			bulkProgress,
			setBulkProgress,
			importResults,
			setImportResults,
			selectedTagIds,
			setSelectedTagIds,
			selectionCount,
			importDirs,
			handlePickFile,
			handleSelectAppDir,
			handleSelectCustom,
			handleToggleFeature,
			handleSelectAllFeatures,
			handleDeselectAllFeatures,
			handleToggleFile,
			handleSelectAllFiles,
			handleDeselectAllFiles,
			handleImport,
			handleResultDone,
			dismissedRef,
			mutationRef,
		}),
		[
			step,
			importMode,
			features,
			filename,
			sourceFilePath,
			selectedIndices,
			dirFiles,
			selectedFileUris,
			bulkProgress,
			importResults,
			selectedTagIds,
			selectionCount,
			importDirs,
			handlePickFile,
			handleSelectAppDir,
			handleSelectCustom,
			handleToggleFeature,
			handleSelectAllFeatures,
			handleDeselectAllFeatures,
			handleToggleFile,
			handleSelectAllFiles,
			handleDeselectAllFiles,
			handleImport,
			handleResultDone,
		]
	);

	return (
		<ImportContextProvider value={ctxValue}>
			<MutationBootstrap mutationRef={mutationRef} />
			<ScrollView contentContainerStyle={localStyles.container}>
				{step === 'idle' && <StepIdle />}

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

				{step === 'preview' && <StepPreview />}

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

				{step === 'result' && <StepResult />}
			</ScrollView>
		</ImportContextProvider>
	);
};

export default memo(ImportPage);
