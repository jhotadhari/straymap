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
import { openDocument } from 'react-native-scoped-storage';
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

const ImportModal: FC<{
	visible: boolean;
	onDismiss: () => void;
}> = ({ visible, onDismiss }) => {
	const theme = useTheme();
	const { t } = useTranslation();
	const { showError } = useContext(ErrorToastContext);
	const queryClient = useQueryClient();

	const [step, setStep] = useState<'idle' | 'parsing' | 'preview' | 'importing'>('idle');
	const [features, setFeatures] = useState<
		Feature<LineString, GeoJsonProperties>[]
	>([]);
	const [filename, setFilename] = useState('');
	const [_mergeMode, _setMergeMode] = useState(false);
	const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

	const [_isPicking, runOpenDocument] = useAsyncBusy(openDocument);

	// Track whether the modal has been dismissed so in-flight
	// async callbacks don't overwrite clean post-dismiss state.
	const dismissedRef = useRef(false);

	const mutation = useMutation({
		mutationFn: async () => {
			const toImport = features.filter((_, idx) => selectedIndices.has(idx));
			if (!toImport.length) {
				return;
			}

			// Auto-tag: find or create an "imported" tag
			let importTagId: number | undefined;
			if (dbConnection?.drizzle) {
				const existing = await dbConnection.drizzle
					.select({ id: tagsTable.id })
					.from(tagsTable)
					.where(eq(tagsTable.label, 'imported'))
					.limit(1);
				if (existing.length) {
					importTagId = existing[0].id;
				} else {
					const created = await createTags([
						{
							label: 'imported',
							notes: null,
							data: null,
						},
					]);
					if (created?.length) {
						importTagId = created[0].id;
					}
				}
			}

			const newLines = toImport.map((feature) => ({
				title:
					feature.properties?.name ?? filename.replace(/\.[^.]+$/, ''),
				lineStringFeature: feature,
				tagIds: importTagId ? [importTagId] : undefined,
			}));
			await createLines(newLines);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['lines'] });
			// Bypass handleDismiss — its step==='importing' guard
			// would block cleanup here since step hasn't changed yet.
			setStep('idle');
			setFeatures([]);
			setFilename('');
			_setMergeMode(false);
			setSelectedIndices(new Set());
			onDismiss();
		},
		onError: (err) => {
			logError('ImportModal.import', err);
			showError(
				sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err))
			);
			setStep('preview');
		},
	});

	const handlePickFile = useCallback(async () => {
		try {
			const file = await runOpenDocument(false);
			if (!file?.uri || dismissedRef.current) {
				return;
			}

			setStep('parsing');
			const name = file.name ?? file.uri.split('/').pop() ?? '';
			setFilename(name);

			const format = detectImportFormat(name);
			if (!format) {
				if (dismissedRef.current) return;
				showError(
					sprintf(
						t('lines.importUnsupportedFormat'),
						name.split('.').pop() ?? ''
					)
				);
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
			// Select all by default
			setSelectedIndices(new Set(result.features.map((_, i) => i)));
			_setMergeMode(false);
			setStep('preview');
		} catch (err) {
			logError('ImportModal.handlePickFile', err);
			showError(
				sprintf(t('errorGeneric'), err instanceof Error ? err.message : String(err))
			);
			setStep('idle');
		}
	}, [runOpenDocument, showError, t]);

	const handleDismiss = useCallback(() => {
		dismissedRef.current = true;
		if (step === 'importing') {
			return;
		}
		setStep('idle');
		setFeatures([]);
		setFilename('');
		_setMergeMode(false);
		setSelectedIndices(new Set());
		onDismiss();
	}, [onDismiss, step]);

	// Reset the dismissed guard when the modal becomes visible again
	const prevVisibleRef = useRef(false);
	if (visible && !prevVisibleRef.current) {
		dismissedRef.current = false;
	}
	prevVisibleRef.current = visible;

	const handleToggleFeature = useCallback(
		(idx: number) => {
			setSelectedIndices((prev) => {
				const next = new Set(prev);
				if (next.has(idx)) {
					next.delete(idx);
				} else {
					next.add(idx);
				}
				return next;
			});
		},
		[]
	);

	const handleSelectAll = useCallback(() => {
		setSelectedIndices(new Set(features.map((_, i) => i)));
	}, [features]);

	const handleDeselectAll = useCallback(() => {
		setSelectedIndices(new Set());
	}, []);

	const handleImport = useCallback(() => {
		if (!selectedIndices.size) {
			return;
		}
		setStep('importing');
		mutation.mutate();
	}, [selectedIndices, mutation]);

	return (
		<ModalWrapper
			visible={visible}
			onDismiss={handleDismiss}
			header={t('lines.importTitle')}
			innerStyle={localStyles.modalInner}
		>
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
						buttonColor={get(theme.colors, 'primaryContainer')}
						textColor={get(theme.colors, 'onPrimaryContainer')}
					>
						<Text>{t('lines.importPickFile')}</Text>
					</ButtonHighlight>
				</View>
			)}

			{step === 'parsing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('lines.importParsing')}</Text>
				</View>
			)}

			{step === 'preview' && (
				<View>
					<Text style={localStyles.filename}>{filename}</Text>
					<Text style={localStyles.featureCount}>
						{sprintf(t('lines.importFeatureCount'), features.length)}
					</Text>

					{/* Select all / none */}
					<View style={localStyles.selectRow}>
						<ButtonHighlight
							mode="text"
							compact={true}
							onPress={handleSelectAll}
						>
							<Text>{t('lines.selectAll')}</Text>
						</ButtonHighlight>
						<ButtonHighlight
							mode="text"
							compact={true}
							onPress={handleDeselectAll}
						>
							<Text>{t('lines.selectNone')}</Text>
						</ButtonHighlight>
					</View>

					{/* Feature list */}
					<ScrollView
						style={localStyles.featureList}
						horizontal={false}
					>
						{features.map((feature, idx) => (
							<View
								key={idx}
								style={[
									localStyles.featureRow,
									{
										borderColor: theme.colors.outline,
									},
								]}
							>
								<Checkbox
									status={
										selectedIndices.has(idx)
											? 'checked'
											: 'unchecked'
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

					{/* Import button */}
					<View style={localStyles.importControls}>
						<ButtonHighlight
							onPress={handleImport}
							mode="contained"
							disabled={!selectedIndices.size}
							buttonColor={get(theme.colors, 'successContainer')}
							textColor={get(theme.colors, 'onSuccessContainer')}
						>
							<Text>
								{sprintf(
									t('lines.importSelected'),
									selectedIndices.size
								)}
							</Text>
						</ButtonHighlight>
					</View>
				</View>
			)}

			{step === 'importing' && (
				<View style={localStyles.centered}>
					<LoadingIndicator />
					<Text>{t('lines.importing')}</Text>
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
	importControls: {
		marginTop: 12,
	},
});

export default ImportModal;
